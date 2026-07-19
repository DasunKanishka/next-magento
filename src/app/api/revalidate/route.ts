import 'server-only';

import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';

/**
 * On-demand cache revalidation Route Handler — the OPTIONAL fast path for
 * surfacing admin content edits. The zero-coupling baseline is the time-based
 * safety window on the cached read itself (`cacheLife` on `getStoreIdentity`
 * in the Magento adapter); this endpoint just lets that staleness window be
 * shortened to "immediately" when an operator wires ANY authed trigger at it
 * (a cron ping, a manual/CI call, or a backend webhook only if the platform
 * happens to support one). Nothing here is required by, or installs into,
 * Magento — this is a storefront-only capability, consistent with the
 * headless "plugs into any stock Magento 2" architecture.
 *
 * Deliberately placed OUTSIDE `api/bff/` — the `bff/` routes are
 * browser-initiated mutation surfaces (e.g. the newsletter subscribe form).
 * This route is the opposite shape: never called by the storefront's own
 * client code, only by an operator-controlled trigger holding a shared
 * secret. Grouping it separately keeps "public-facing BFF surface" and
 * "operator-authenticated admin surface" visually distinct in the route tree.
 *
 * Auth: a shared secret in the `x-revalidate-secret` header, compared against
 * the server-only `REVALIDATE_SECRET` env var using a constant-time
 * comparison. `REVALIDATE_SECRET` must NEVER be prefixed `NEXT_PUBLIC_` — it
 * would otherwise inline into the client bundle and defeat the auth entirely
 * (`check:no-public-secrets` enforces this).
 *
 * Contract:  POST { tag?: string; storeCode?: string }  ->  { revalidated: boolean; tag?: string }
 * `tag` defaults to `store-identity` and MUST be on the allow-list below —
 * this keeps the endpoint from being usable to invalidate arbitrary cache
 * tags. `storeCode` is accepted for operator bookkeeping / forward
 * compatibility but does not currently change which entries are invalidated:
 * `store-identity` is a single flat tag (set in the adapter, not parameterized
 * per store), so a revalidation call marks every store's identity cache entry
 * stale at once. That is NOT a cross-store leak: each entry is still keyed
 * independently by `storeCode` via the `'use cache'` argument-based cache key,
 * so the next read for a given store always re-fetches and re-caches that
 * store's own data — invalidating broadly just means "every store's cached
 * identity is due for a fresh fetch," never "store A can read store B's data."
 *
 * Replay safety: `revalidateTag` is idempotent — invoking it twice for the
 * same tag before anything re-reads it is a no-op the second time. No
 * nonce/timestamp is needed to guard against replay of a captured request.
 */

const SECRET_HEADER = 'x-revalidate-secret';
const DEFAULT_TAG = 'store-identity';
const ALLOWED_TAGS: ReadonlySet<string> = new Set(['store-identity']);

interface RevalidateResponse {
  revalidated: boolean;
  tag?: string;
}

function json(body: RevalidateResponse, status: number): Response {
  return Response.json(body, { status });
}

/**
 * Constant-time secret comparison. `timingSafeEqual` throws if the two
 * buffers differ in length, which would itself leak the expected secret's
 * length through a thrown-vs-not timing/behavior difference. To avoid that,
 * a length mismatch is handled by comparing the provided buffer against
 * itself (same cost as a real comparison of that length) and then returning
 * `false` — so a wrong-length guess and a right-length-wrong-content guess
 * both take a comparable code path and neither short-circuits on length.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Authenticate the request against the server-only secret. Fails CLOSED: an
 * unset/empty `REVALIDATE_SECRET` can never authenticate anything — it is
 * treated as "no valid credential exists," never as "skip the check."
 */
function isAuthorized(request: Request): boolean {
  const serverSecret = process.env.REVALIDATE_SECRET;
  if (!serverSecret) return false;

  const providedSecret = request.headers.get(SECRET_HEADER);
  if (!providedSecret) return false;

  return secretsMatch(providedSecret, serverSecret);
}

interface RevalidateBody {
  tag?: string;
  storeCode?: string;
}

/** Returns `undefined` for a malformed body — the caller responds 400. */
async function parseBody(request: Request): Promise<RevalidateBody | undefined> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return undefined;
  }

  if (raw.trim() === '') return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return undefined;
  }

  const { tag, storeCode } = parsed as { tag?: unknown; storeCode?: unknown };
  if (tag !== undefined && typeof tag !== 'string') return undefined;
  if (storeCode !== undefined && typeof storeCode !== 'string') return undefined;

  return { tag, storeCode };
}

export async function POST(request: Request): Promise<Response> {
  // 1) Auth first — fail closed on a missing/wrong secret, and do NOT
  //    revalidate anything on this path.
  if (!isAuthorized(request)) {
    return json({ revalidated: false }, 401);
  }

  // 2) Validate the payload shape + tag allow-list. A malformed body or a
  //    tag outside the allow-list is 400 and revalidates nothing — this is
  //    what keeps an authenticated caller from invalidating arbitrary tags.
  const body = await parseBody(request);
  if (!body) {
    return json({ revalidated: false }, 400);
  }

  const tag = body.tag ?? DEFAULT_TAG;
  if (!ALLOWED_TAGS.has(tag)) {
    return json({ revalidated: false }, 400);
  }

  // 3) Revalidate. `{ expire: 0 }` is Next's documented Route-Handler path for
  //    an IMMEDIATE expiration (the next read is a blocking cache miss) — this
  //    handler isn't a Server Action, so `updateTag` (the other immediate-
  //    expiration primitive) isn't callable here; passing `'max'` instead
  //    would only mark the entry for background stale-while-revalidate, which
  //    is weaker than what "on-demand" is meant to deliver. Idempotent — see
  //    the replay-safety note above.
  revalidateTag(tag, { expire: 0 });

  return json({ revalidated: true, tag }, 200);
}

/**
 * Explicit 405 for every non-POST method. Next.js Route Handlers already
 * auto-implement a 405 for methods left unexported, but these are exported
 * explicitly so the behavior is a directly testable application contract
 * rather than an implicit framework default — including in this security-
 * sensitive handler, "which methods are rejected" should be as visible and
 * as unit-testable as "which requests are authenticated."
 */
function methodNotAllowed(): Response {
  return Response.json(
    { revalidated: false },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
