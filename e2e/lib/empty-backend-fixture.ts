import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';

/**
 * The empty-backend invariant-gate fixture.
 *
 * The per-content-type round-trip suite enumerates known fields and round-trips
 * each one — a real backend edit always shows up, but nothing there asserts
 * the CONVERSE: that an UNAUTHORED zone renders nothing rather than a
 * hardcoded fallback. That gap is exactly how a hardcoded `SeoContent`
 * stat-callout set shipped green once. This fixture proves the converse directly by
 * standing up a SECOND production Next.js server instance, pointed at a tiny
 * stub GraphQL server that returns empty CMS blocks / categories / products
 * (plus the bare-minimum `storeConfig` the store-identity fail-closed check
 * requires — see `composeStoreIdentity`), and asserting the rendered home
 * route carries no proof-point figures and no static editorial anywhere.
 *
 * Why a second server rather than a Playwright `page.route()` intercept: the
 * Magento client is `server-only` — SSR fetches happen in the Node server
 * process, never in the browser, so a browser-side network intercept cannot
 * see them. `getMagentoClient()` (src/lib/data-source/magento/client.ts)
 * reads `MAGENTO_GRAPHQL_ENDPOINT` from `process.env` on every call (never
 * baked in at build time), so a second `next start` process with that env var
 * repointed at the stub is a real, black-box-honest way to exercise the
 * actual server code path against an empty backend — not a mock of the
 * frontend's OWN data layer.
 *
 * This reuses the SAME production build the main suite's `webServer` already
 * produced (`next build`), started a second time on a different port with a
 * different `MAGENTO_GRAPHQL_ENDPOINT` — no second build. `playwright.config.ts`
 * guarantees that build has already completed before any spec file runs, so
 * there is no race on `.next/`.
 */

/** Loopback-only — this stub never needs to be reachable off-box. */
const HOST = '127.0.0.1';

/** Arbitrary, fixed ports distinct from the main suite's :3000. */
export const EMPTY_BACKEND_MOCK_PORT = 4310;
export const EMPTY_BACKEND_APP_PORT = 4311;

export const EMPTY_BACKEND_BASE_URL = `http://${HOST}:${EMPTY_BACKEND_APP_PORT}`;
const EMPTY_BACKEND_GRAPHQL_ENDPOINT = `http://${HOST}:${EMPTY_BACKEND_MOCK_PORT}/graphql`;

/**
 * One fixed GraphQL response body for EVERY request, regardless of query or
 * variables. This works because every `DataSource` read destructures only the
 * top-level field it asked for (`data.storeConfig`, `data.cmsBlocks.items`,
 * `data.categoryList`, `data.products.items`) — it never validates the
 * response against the query it sent. Returning the full superset for every
 * call is simpler than parsing the incoming query and is exactly as
 * effective: every home content zone resolves to empty, and the ONE
 * `store_identity_legal` block below is the sole authored value, present just
 * far enough to satisfy the store-identity fail-closed gate (`name`,
 * `copyright`, `registrationNumber` — see `composeStoreIdentity`) so the page
 * takes the graceful-empty path under test rather than the (unrelated)
 * fail-closed error-boundary path.
 */
const EMPTY_BACKEND_RESPONSE = {
  data: {
    storeConfig: {
      store_code: 'default',
      locale: 'en_US',
      base_currency_code: 'EUR',
      secure_base_media_url: 'https://empty-backend.invalid/media/',
      cms_home_page: 'home',
      header_logo_src: null,
      logo_alt: null,
      copyright: 'Empty Backend Fixture',
      store_name: 'Empty Backend Fixture Store',
    },
    cmsBlocks: {
      items: [
        {
          identifier: 'store_identity_legal',
          title: null,
          content: '<span class="registration-number">EMPTY-0000</span>',
        },
      ],
    },
    categoryList: [],
    products: { items: [] },
    subscribeEmailToNewsletter: { status: 'NOT_ACTIVE' },
  },
};

/** Starts the stub GraphQL server. Resolves once it is listening. */
function startMockGraphQLServer(): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('empty-backend fixture ok');
        return;
      }
      // The body (the GraphQL query/variables) is deliberately never parsed —
      // see EMPTY_BACKEND_RESPONSE's doc comment.
      req.resume();
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(EMPTY_BACKEND_RESPONSE));
      });
    });
    server.once('error', reject);
    server.listen(EMPTY_BACKEND_MOCK_PORT, HOST, () => resolve(server));
  });
}

/** Polls `url` until it responds (any status) or `timeoutMs` elapses. */
async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(2_000) });
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(
    `empty-backend fixture: ${url} never became reachable within ${timeoutMs}ms (${String(lastError)})`,
  );
}

/** Starts a second production Next.js server against the empty-backend stub. */
function startAppAgainstEmptyBackend(): ChildProcess {
  const child = spawn(
    'pnpm',
    ['exec', 'next', 'start', '-p', String(EMPTY_BACKEND_APP_PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MAGENTO_GRAPHQL_ENDPOINT: EMPTY_BACKEND_GRAPHQL_ENDPOINT,
        PORT: String(EMPTY_BACKEND_APP_PORT),
      },
      stdio: 'pipe',
    },
  );
  return child;
}

export interface EmptyBackendFixture {
  mockServer: Server;
  appProcess: ChildProcess;
}

/** Brings up the stub GraphQL server + the second app instance, in order. */
export async function startEmptyBackendFixture(): Promise<EmptyBackendFixture> {
  const mockServer = await startMockGraphQLServer();
  const appProcess = startAppAgainstEmptyBackend();
  try {
    await waitForHttp(EMPTY_BACKEND_BASE_URL, 120_000);
  } catch (err) {
    appProcess.kill();
    mockServer.close();
    throw err;
  }
  return { mockServer, appProcess };
}

/** Tears both processes down. Safe to call even if startup partially failed. */
export async function stopEmptyBackendFixture(
  fixture: Partial<EmptyBackendFixture>,
): Promise<void> {
  if (fixture.appProcess) {
    fixture.appProcess.kill();
  }
  if (fixture.mockServer) {
    await new Promise<void>((resolve) => fixture.mockServer!.close(() => resolve()));
  }
}
