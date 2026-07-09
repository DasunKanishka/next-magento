import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearStoreContextCache } from '@/lib/data-source/store-context';

import { POST } from './route';

/**
 * Integration tests for the newsletter BFF Route Handler.
 *
 * The backend GraphQL layer is MOCKED at the `graphql-request` client boundary
 * (built from the committed schema's response shapes) — no live backend is
 * contacted. Every outbound request the real adapter constructs still flows
 * through the real header-setting code, so header assertions are meaningful.
 */

const h = vi.hoisted(() => ({
  // Records of every constructed client and every issued request.
  constructed: [] as Array<{ endpoint: string; headers: Record<string, string> }>,
  requests: [] as Array<{
    operation: string;
    headers: Record<string, string>;
    variables: unknown;
  }>,
  control: {
    subscribeStatus: 'SUBSCRIBED' as string | null,
    subscribeThrows: null as Error | null,
  },
  // Deliberately backend-shaped secrets used to prove they never leak out.
  ENDPOINT: 'https://backend.internal.example/graphql',
  TOKEN: 'secret-integration-token-abc123',
}));

vi.mock('graphql-request', () => {
  function operationName(document: unknown): string {
    const defs = (document as { definitions?: Array<{ name?: { value?: string } }> })
      .definitions;
    return defs?.[0]?.name?.value ?? 'unknown';
  }

  class GraphQLClient {
    endpoint: string;
    headers: Record<string, string>;

    constructor(endpoint: string, config?: { headers?: Record<string, string> }) {
      this.endpoint = endpoint;
      this.headers = config?.headers ?? {};
      h.constructed.push({ endpoint, headers: this.headers });
    }

    async request(document: unknown, variables?: unknown): Promise<unknown> {
      const operation = operationName(document);
      h.requests.push({ operation, headers: this.headers, variables });

      if (operation === 'StoreConfig') {
        return {
          storeConfig: {
            store_code: 'default',
            locale: 'nl_NL',
            base_currency_code: 'EUR',
            secure_base_media_url: `${h.ENDPOINT.replace('/graphql', '')}/media/`,
            cms_home_page: 'home',
          },
        };
      }
      if (operation === 'SubscribeNewsletter') {
        if (h.control.subscribeThrows) throw h.control.subscribeThrows;
        return { subscribeEmailToNewsletter: { status: h.control.subscribeStatus } };
      }
      throw new Error(`unexpected operation in test mock: ${operation}`);
    }
  }

  return { GraphQLClient };
});

/**
 * Build a request. `realIp` is the trusted peer the proxy would stamp into
 * `X-Real-IP` (the throttle key under the trusted-single-proxy model).
 *
 * Options model attacker/proxy header shapes:
 *  - `forgedXffFirstHop`  — a client-supplied `X-Forwarded-For` value that nginx
 *    APPENDS the real peer to (`<forged…>, <realIp>`), reproducing
 *    `$proxy_add_x_forwarded_for`.
 *  - `omitRealIp`         — drop `X-Real-IP` to exercise the XFF-last-hop fallback.
 */
function makeRequest(
  body: unknown,
  realIp: string,
  opts: { raw?: string; forgedXffFirstHop?: string; omitRealIp?: boolean } = {},
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (!opts.omitRealIp) headers['x-real-ip'] = realIp;
  if (opts.forgedXffFirstHop !== undefined) {
    headers['x-forwarded-for'] = `${opts.forgedXffFirstHop}, ${realIp}`;
  }
  return new Request('http://localhost/api/bff/newsletter', {
    method: 'POST',
    headers,
    body: opts.raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  h.constructed.length = 0;
  h.requests.length = 0;
  h.control.subscribeStatus = 'SUBSCRIBED';
  h.control.subscribeThrows = null;
  process.env.MAGENTO_GRAPHQL_ENDPOINT = h.ENDPOINT;
  process.env.MAGENTO_STORE_CODE = 'default';
  // Isolate the memoized store-context cache between tests so each test's first
  // submit performs the StoreConfig resolution.
  clearStoreContextCache();
});

describe('POST /api/bff/newsletter', () => {
  it('sets Store on every outbound request and Content-Currency on the subscribe call', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', consent: true }, '10.0.0.1'));
    expect(res.status).toBe(200);

    // Store scopes every outbound request explicitly (non-defaulted).
    expect(h.requests.length).toBeGreaterThanOrEqual(2);
    for (const req of h.requests) {
      expect(req.headers.Store).toBe('default');
    }

    // The scope-bound subscribe mutation carries the resolved Content-Currency.
    // (The StoreConfig bootstrap call legitimately has none — it is what
    // resolves the currency in the first place.)
    const subscribe = h.requests.find((r) => r.operation === 'SubscribeNewsletter');
    expect(subscribe).toBeDefined();
    expect(subscribe?.headers.Store).toBe('default');
    expect(subscribe?.headers['Content-Currency']).toBe('EUR');
  });

  it('returns { status: "subscribed" } on a happy-path subscribe (SUBSCRIBED)', async () => {
    const res = await POST(makeRequest({ email: 'x@y.com', consent: true }, '10.0.0.2'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'subscribed' });
  });

  it('treats NOT_ACTIVE (double opt-in pending) as a successful subscribe', async () => {
    h.control.subscribeStatus = 'NOT_ACTIVE';
    const res = await POST(makeRequest({ email: 'x@y.com', consent: true }, '10.0.0.4'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'subscribed' });
  });

  it('returns 429 with a positive Retry-After on the 6th submission from one IP', async () => {
    const ip = '10.0.0.3';
    for (let i = 0; i < 5; i += 1) {
      const ok = await POST(makeRequest({ email: `u${i}@x.com`, consent: true }, ip));
      expect(ok.status).toBe(200);
    }

    const sixth = await POST(makeRequest({ email: 'u6@x.com', consent: true }, ip));
    expect(sixth.status).toBe(429);
    const retryAfter = sixth.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(await sixth.json()).toEqual({ status: 'error' });
  });

  it('rejects consent !== true with HTTP 400 and a neutral error body', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', consent: false }, '10.0.0.5'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ status: 'error' });
  });

  it('rejects a malformed / absent email with HTTP 400', async () => {
    const missing = await POST(makeRequest({ consent: true }, '10.0.0.6'));
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({ status: 'error' });

    const malformed = await POST(
      makeRequest({ email: 'not-an-email', consent: true }, '10.0.0.7'),
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ status: 'error' });
  });

  it('rejects an unparseable JSON body with HTTP 400', async () => {
    const res = await POST(makeRequest(null, '10.0.0.8', { raw: 'this is not json' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ status: 'error' });
  });

  it('never leaks a backend token, URL, or header — even when the upstream throws', async () => {
    // Simulate a transport error whose message embeds the endpoint URL + token,
    // exactly the kind of raw error graphql clients surface.
    h.control.subscribeThrows = new Error(
      `request to ${h.ENDPOINT} failed — Authorization: Bearer ${h.TOKEN}`,
    );

    const res = await POST(makeRequest({ email: 'z@z.com', consent: true }, '10.0.0.9'));
    expect(res.status).toBe(200);

    const bodyText = await res.text();
    // Body is EXACTLY the neutral outcome — nothing else.
    expect(bodyText).toBe(JSON.stringify({ status: 'error' }));
    expect(bodyText).not.toContain(h.ENDPOINT);
    expect(bodyText).not.toContain(h.TOKEN);
    expect(bodyText).not.toContain('Bearer');

    const headerDump = [...res.headers.entries()]
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    expect(headerDump).not.toContain(h.ENDPOINT);
    expect(headerDump).not.toContain(h.TOKEN);
    expect(headerDump.toLowerCase()).not.toContain('authorization');
  });

  it('leaks nothing backend-specific on the happy path either', async () => {
    const res = await POST(
      makeRequest({ email: 'ok@ok.com', consent: true }, '10.0.0.10'),
    );
    const bodyText = await res.text();
    expect(bodyText).toBe(JSON.stringify({ status: 'subscribed' }));
    const headerDump = [...res.headers.entries()]
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    expect(headerDump).not.toContain(h.ENDPOINT);
    expect(headerDump).not.toContain(h.TOKEN);
  });

  // Regression: a client that rotates the FIRST X-Forwarded-For hop on every
  // request must NOT escape the throttle. The key is the proxy-stamped real
  // peer (X-Real-IP), not the client-forged hop.
  it('still throttles when the forged X-Forwarded-For first hop rotates each request (keyed on X-Real-IP)', async () => {
    const realPeer = '203.0.113.7';
    for (let i = 0; i < 5; i += 1) {
      const res = await POST(
        makeRequest({ email: `r${i}@x.com`, consent: true }, realPeer, {
          forgedXffFirstHop: `9.9.9.${i}`, // attacker rotates this every request
        }),
      );
      expect(res.status).toBe(200);
    }

    const blocked = await POST(
      makeRequest({ email: 'r6@x.com', consent: true }, realPeer, {
        forgedXffFirstHop: '9.9.9.99',
      }),
    );
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  // Regression: with X-Real-IP absent, the fallback uses the LAST X-Forwarded-For
  // hop (the one nginx appended = the real peer), not the forged first hop.
  it('still throttles via the last X-Forwarded-For hop when X-Real-IP is absent', async () => {
    const realPeer = '203.0.113.8';
    for (let i = 0; i < 5; i += 1) {
      const res = await POST(
        makeRequest({ email: `f${i}@x.com`, consent: true }, realPeer, {
          omitRealIp: true,
          forgedXffFirstHop: `8.8.8.${i}`,
        }),
      );
      expect(res.status).toBe(200);
    }

    const blocked = await POST(
      makeRequest({ email: 'f6@x.com', consent: true }, realPeer, {
        omitRealIp: true,
        forgedXffFirstHop: '8.8.8.99',
      }),
    );
    expect(blocked.status).toBe(429);
  });

  it('throttles two distinct real peers independently', async () => {
    const peerA = '203.0.113.10';
    const peerB = '203.0.113.11';

    // Exhaust peer A's window.
    for (let i = 0; i < 5; i += 1) {
      const res = await POST(makeRequest({ email: `a${i}@x.com`, consent: true }, peerA));
      expect(res.status).toBe(200);
    }
    expect(
      (await POST(makeRequest({ email: 'a6@x.com', consent: true }, peerA))).status,
    ).toBe(429);

    // Peer B is unaffected — its own window is still open.
    const resB = await POST(makeRequest({ email: 'b1@x.com', consent: true }, peerB));
    expect(resB.status).toBe(200);
  });
});
