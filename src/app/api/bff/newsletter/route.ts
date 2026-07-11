import 'server-only';

import { getDataSource } from '@/lib/data-source';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { createRateLimiter } from '@/lib/rate-limit';

/**
 * Newsletter subscribe Route Handler — the one client-initiated mutation
 * surface. Runs server-side only: the browser posts a first-party request
 * here, and this handler reaches the backend through the `DataSource`
 * interface. No backend URL, header, or token is ever placed in the response.
 *
 * This handler runs on the default (Node.js) server runtime — the connector is
 * server-only and relies on Node APIs / server env vars that must never be
 * edge/client-bundled. The runtime is not pinned via a route-segment export,
 * which is incompatible with the cache directive enabled app-wide; Node is the
 * default for route handlers, and the `server-only` import keeps this off any
 * client/edge bundle regardless.
 *
 * Contract:  POST { email: string; consent: true }  ->  { status: 'subscribed' | 'error' }
 */

/** The neutral response shape — the ONLY thing ever returned to the client. */
interface NewsletterResponse {
  status: 'subscribed' | 'error';
}

// Per-IP throttle: max 5 submissions per IP per 10-minute sliding window.
// NOTE: in-memory & per-instance — see `createRateLimiter`'s doc comment; a
// multi-instance deployment needs a shared store to enforce a global limit.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const throttle = createRateLimiter({
  limit: MAX_PER_WINDOW,
  windowMs: WINDOW_MS,
});

/**
 * Resolve the throttle key from the reverse-proxy forwarding headers under a
 * TRUSTED-SINGLE-PROXY model: the app is only ever reached through one nginx
 * reverse proxy, so the ONLY trustworthy signal of the real peer is what that
 * proxy stamps — never what the client sends.
 *
 * The proxy overwrites `X-Real-IP` with the real TCP peer, so we use it first.
 * If it is absent we fall back to the LAST comma-segment of `X-Forwarded-For`:
 * nginx uses `$proxy_add_x_forwarded_for`, which APPENDS the real peer to any
 * client-supplied value, so the header reads `<client-forged…>, <real-peer>` —
 * the last hop is the one nginx itself added and is not client-forgeable, while
 * the FIRST hop is fully attacker-controlled (rotating it would mint a fresh
 * bucket every request and defeat the throttle). A missing/empty pair falls
 * back to a single constant bucket so throttling is never silently disabled.
 */
function resolveClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor.split(',');
    const lastHop = hops[hops.length - 1]?.trim();
    if (lastHop) return lastHop;
  }

  return 'unknown';
}

/** Minimal, dependency-free email shape check. */
function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json(body: NewsletterResponse, init?: ResponseInit): Response {
  return Response.json(body, init);
}

export async function POST(request: Request): Promise<Response> {
  // 1) Throttle first — a submission attempt counts toward the window even if
  //    its body is malformed, so the limit also bounds probing traffic.
  const { allowed, retryAfterSeconds } = throttle.check(resolveClientIp(request));
  if (!allowed) {
    return json(
      { status: 'error' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      },
    );
  }

  // 2) Validate the body: `email` must look like an email and `consent` must be
  //    the literal `true`. Anything else → 400, neutral error body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ status: 'error' }, { status: 400 });
  }

  const email = (body as { email?: unknown } | null)?.email;
  const consent = (body as { consent?: unknown } | null)?.consent;
  if (!isValidEmail(email) || consent !== true) {
    return json({ status: 'error' }, { status: 400 });
  }

  // 3) Resolve store context (scope currency) and subscribe through the
  //    DataSource. The adapter contains any backend error and returns a neutral
  //    status, so nothing backend-specific can leak into the response.
  const { storeCode, currency } = await resolveStoreContext();
  const result = await getDataSource().subscribeToNewsletter({
    email,
    storeCode,
    currency,
  });

  // 4) Respond with the neutral status ONLY, HTTP 200. The subscribe outcome
  //    (including an upstream failure) is carried in the body's `status` field
  //    per the fixed body contract — the client reads `status`, and the error
  //    stays fully visible there. Guard failures use their own codes (400
  //    validation, 429 throttle); a resolved subscribe result is a 200 with the
  //    outcome in the body, and never any backend detail in body or headers.
  return json(result, { status: 200 });
}
