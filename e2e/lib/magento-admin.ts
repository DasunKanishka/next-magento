import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { request as pwRequest, type APIRequestContext } from '@playwright/test';

/**
 * Support library for the admin-round-trip E2E suite (admin-roundtrip.spec.ts).
 * Every content-type case in that spec edits the SHARED live dev Magento
 * store through one of three mechanisms, all wrapped here:
 *
 *   1. `runMagentoCli` / `magentoConfigSet` — native store config, via the
 *      Dockerized backend's `make magento` / `make n98-magerun2` CLI (no
 *      REST endpoint exists for plain `core_config_data` writes here).
 *   2. `getAdminToken` + `getCmsBlockByIdentifier` / `setCmsBlockContent` —
 *      native CMS blocks, via the Admin REST API (confirmed reachable and
 *      reflects on the storefront GraphQL immediately, no cache:flush
 *      needed).
 *   3. `setStoreViewName` — the store-VIEW "Name" field
 *      (`storeConfig.store_name`). Stock Magento exposes no REST/CLI setter
 *      for it, but the `store` table is the same native source the admin UI
 *      writes, so this edits it directly (via `n98 db:query`) + flushes cache
 *      — deterministic, unlike driving the JS-heavy admin UI in CI. `''` is a
 *      valid argument (the DB has no required-field guard), so BOTH the
 *      positive round-trip AND the `name` fail-closed case are exercised.
 */

/** Sibling repo holding the Dockerized dev Magento stack (`make magento`, `make n98-magerun2`). */
const BACKEND_DIR = path.resolve(process.cwd(), '..', 'backend');

export const MAGENTO_ADMIN_BASE_URL = (process.env.MAGENTO_ADMIN_BASE_URL ?? '').replace(
  /\/$/,
  '',
);
export const MAGENTO_ADMIN_USER = process.env.MAGENTO_ADMIN_USER ?? '';
export const MAGENTO_ADMIN_PASSWORD = process.env.MAGENTO_ADMIN_PASSWORD ?? '';
export const MAGENTO_GRAPHQL_ENDPOINT = process.env.MAGENTO_GRAPHQL_ENDPOINT ?? '';
export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? '';

/** Every credential this suite needs is present. `false` ⇒ tests must skip with `needs-confirm.`, never fake a pass. */
export function adminEnvAvailable(): boolean {
  return Boolean(
    MAGENTO_ADMIN_BASE_URL &&
    MAGENTO_ADMIN_USER &&
    MAGENTO_ADMIN_PASSWORD &&
    MAGENTO_GRAPHQL_ENDPOINT,
  );
}

/** The sibling backend repo (with its `make magento` CLI) is present on this machine. */
export function backendCliAvailable(): boolean {
  try {
    statSync(BACKEND_DIR);
    return true;
  } catch {
    return false;
  }
}

// ── Native store-config CLI (config paths, not CMS blocks) ────────────────

function shQuote(value: string): string {
  // Single-quote the value for the Makefile recipe line's own shell
  // interpretation (see the module doc comment) — embedded single quotes are
  // closed, escaped, and reopened, the standard POSIX-shell-safe pattern.
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Runs `make magento args="<args>"` in the sibling backend repo (the Dockerized dev Magento CLI). */
export function runMagentoCli(argsString: string): string {
  return execFileSync('make', ['magento', `args=${argsString}`], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
    timeout: 60_000,
  });
}

/** Runs `make n98-magerun2 args="<args>"` — used only for `config:store:delete` (no equivalent in `bin/magento`). */
export function runN98MagerunCli(argsString: string): string {
  return execFileSync('make', ['n98-magerun2', `args=${argsString}`], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
    timeout: 60_000,
  });
}

/** Sets a native `core_config_data` value at store scope 1 and flushes cache so the next GraphQL read reflects it. */
export function magentoConfigSet(configPath: string, value: string): void {
  runMagentoCli(
    `config:set --scope=stores --scope-code=default ${configPath} ${shQuote(value)}`,
  );
  runMagentoCli('cache:flush');
}

/** Deletes a `core_config_data` override entirely (both default and store scope) — the true "unset" restore for a field whose baseline is absent, not empty-string. */
export function magentoConfigDelete(configPath: string): void {
  try {
    runN98MagerunCli(`config:store:delete ${configPath}`);
  } catch {
    // Already absent at default scope — fine, keep going.
  }
  try {
    runN98MagerunCli(`config:store:delete ${configPath} --scope=stores --scope-id=1`);
  } catch {
    // Already absent at store scope — fine.
  }
  runMagentoCli('cache:flush');
}

// ── Admin REST API (token + CMS blocks) ────────────────────────────────────

let sharedAdminApiContext: Promise<APIRequestContext> | undefined;

/** Lazily-created, reused `ignoreHTTPSErrors` API context for every direct-to-Magento call (admin REST + GraphQL) in this suite — the backend's cert is mkcert-issued and not trusted by Node's default TLS store at this late a load point (see playwright.config.ts). */
function adminApiContext(): Promise<APIRequestContext> {
  if (!sharedAdminApiContext) {
    sharedAdminApiContext = pwRequest.newContext({ ignoreHTTPSErrors: true });
  }
  return sharedAdminApiContext;
}

export async function disposeAdminApiContext(): Promise<void> {
  if (sharedAdminApiContext) {
    const ctx = await sharedAdminApiContext;
    await ctx.dispose();
    sharedAdminApiContext = undefined;
  }
  cachedAdminToken = undefined;
}

let cachedAdminToken: Promise<string> | undefined;

async function fetchAdminToken(): Promise<string> {
  const ctx = await adminApiContext();
  const resp = await ctx.post(
    `${MAGENTO_ADMIN_BASE_URL}/rest/V1/integration/admin/token`,
    {
      data: { username: MAGENTO_ADMIN_USER, password: MAGENTO_ADMIN_PASSWORD },
    },
  );
  if (!resp.ok()) {
    throw new Error(`Admin token request failed: ${resp.status()} ${await resp.text()}`);
  }
  const token = (await resp.json()) as string;
  return token;
}

/** Admin REST bearer token, fetched once and reused for every CMS-block call in the run. */
export function getAdminToken(): Promise<string> {
  if (!cachedAdminToken) {
    cachedAdminToken = fetchAdminToken();
  }
  return cachedAdminToken;
}

export interface CmsBlockRecord {
  id: number;
  identifier: string;
  content: string;
}

/** Reads a CMS block's current `{ id, content }` by its stable identifier (see src/config/store-identity-content.ts). */
export async function getCmsBlockByIdentifier(
  identifier: string,
): Promise<CmsBlockRecord> {
  const ctx = await adminApiContext();
  const token = await getAdminToken();
  const resp = await ctx.get(`${MAGENTO_ADMIN_BASE_URL}/rest/V1/cmsBlock/search`, {
    params: {
      'searchCriteria[filterGroups][0][filters][0][field]': 'identifier',
      'searchCriteria[filterGroups][0][filters][0][value]': identifier,
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok()) {
    throw new Error(
      `cmsBlock search failed for "${identifier}": ${resp.status()} ${await resp.text()}`,
    );
  }
  const body = (await resp.json()) as {
    items: { id: number; identifier: string; content: string }[];
  };
  const item = body.items[0];
  if (!item) throw new Error(`CMS block not found: ${identifier}`);
  return { id: item.id, identifier: item.identifier, content: item.content };
}

/** Overwrites a CMS block's content by id (from `getCmsBlockByIdentifier`). Reflects on the storefront GraphQL immediately — no cache:flush needed (confirmed live). */
export async function setCmsBlockContent(id: number, content: string): Promise<void> {
  const ctx = await adminApiContext();
  const token = await getAdminToken();
  const resp = await ctx.put(`${MAGENTO_ADMIN_BASE_URL}/rest/V1/cmsBlock/${id}`, {
    data: { block: { id, content } },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok()) {
    throw new Error(
      `cmsBlock update failed for id ${id}: ${resp.status()} ${await resp.text()}`,
    );
  }
}

// ── Direct GraphQL reads (black-box verification, independent of app internals) ──

export async function queryGraphQL<T>(query: string): Promise<T> {
  const ctx = await adminApiContext();
  const resp = await ctx.post(MAGENTO_GRAPHQL_ENDPOINT, { data: { query } });
  if (!resp.ok()) {
    throw new Error(`GraphQL request failed: ${resp.status()} ${await resp.text()}`);
  }
  const body = (await resp.json()) as { data?: T; errors?: unknown };
  if (body.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  }
  return body.data as T;
}

export interface StoreConfigSnapshot {
  store_name: string | null;
  header_logo_src: string | null;
  logo_alt: string | null;
  copyright: string | null;
}

export async function readStoreConfigSnapshot(): Promise<StoreConfigSnapshot> {
  const data = await queryGraphQL<{ storeConfig: StoreConfigSnapshot }>(
    '{ storeConfig { store_name header_logo_src logo_alt copyright } }',
  );
  return data.storeConfig;
}

export async function readCmsBlockContentViaGraphQL(identifier: string): Promise<string> {
  const data = await queryGraphQL<{ cmsBlocks: { items: { content: string }[] } }>(
    `{ cmsBlocks(identifiers: ["${identifier}"]) { items { identifier content } } }`,
  );
  return data.cmsBlocks.items[0]?.content ?? '';
}

// ── Store-view Name (direct native-source edit — no REST/CLI setter exists) ──

/**
 * Sets the store-view (store_id=1) Name directly in the `store` table, then
 * flushes cache so the next GraphQL read reflects it. Stock Magento exposes
 * no REST endpoint or `bin/magento` command for the store-view Name, but the
 * `store` table IS the same native source the admin UI writes — a direct edit
 * is deterministic and far more reliable in CI than driving Magento's
 * JS-heavy admin UI. Unlike the admin UI (which enforces a required Name),
 * `''` is a valid argument here — used by the `name` fail-closed case to
 * induce the unsourceable state. SQL single quotes in the value are escaped.
 */
export function setStoreViewName(name: string): void {
  const sqlValue = name.replace(/'/g, "''");
  runN98MagerunCli(`db:query "UPDATE store SET name='${sqlValue}' WHERE store_id=1"`);
  runMagentoCli('cache:flush');
}

// ── Dev-server log tail (for the `store-identity:fail-closed field=<name>` marker) ──

const DEV_SERVER_LOG_PATH = path.resolve(process.cwd(), '.e2e-dev-server.log');

/** Byte offset to record BEFORE inducing a fail-closed case, so the later check only looks at NEW log lines (never a stale marker from an earlier run/case). */
export function devServerLogOffset(): number {
  try {
    return statSync(DEV_SERVER_LOG_PATH).size;
  } catch {
    return 0;
  }
}

function devServerLogSince(offset: number): string {
  try {
    return readFileSync(DEV_SERVER_LOG_PATH, 'utf8').slice(offset);
  } catch {
    return '';
  }
}

/** Polls the dev-server log (Next's own SSR console output) for the compliance marker, since the write can lag the HTTP response slightly. */
export async function waitForFailClosedMarker(
  offset: number,
  field: 'name' | 'registrationNumber' | 'copyright',
  timeoutMs = 5_000,
): Promise<boolean> {
  const marker = `store-identity:fail-closed field=${field}`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (devServerLogSince(offset).includes(marker)) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return devServerLogSince(offset).includes(marker);
}

/** Adapter source file backing the 1h `cacheLife` safety-window claim — read directly rather than waiting 1h (see the safety-window test). */
export const STORE_IDENTITY_ADAPTER_PATH = path.resolve(
  process.cwd(),
  'src/lib/data-source/magento/magento-graphql-adapter.ts',
);

export function readStoreIdentityAdapterSource(): string {
  return readFileSync(STORE_IDENTITY_ADAPTER_PATH, 'utf8');
}
