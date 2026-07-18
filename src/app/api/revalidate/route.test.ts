import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for the on-demand revalidation Route Handler.
 *
 * `next/cache`'s `revalidateTag` is mocked so these tests assert on WHETHER it
 * was invoked (and with what tag + profile) without needing a real Next.js
 * cache runtime.
 */

const h = vi.hoisted(() => ({
  revalidateTagCalls: [] as Array<{ tag: string; profile: unknown }>,
}));

vi.mock('next/cache', () => ({
  revalidateTag: (tag: string, profile: unknown) => {
    h.revalidateTagCalls.push({ tag, profile });
  },
}));

// Imported AFTER the mock so the module under test picks up the mocked next/cache.
const { POST, GET, PUT, PATCH, DELETE, HEAD, OPTIONS } = await import('./route');

const SECRET = 'a-real-server-secret-value-0123456789';

function makeRequest(
  method: string,
  opts: { secret?: string | null; body?: unknown; raw?: string } = {},
): Request {
  const headers: Record<string, string> = {};
  if (opts.secret !== undefined && opts.secret !== null) {
    headers['x-revalidate-secret'] = opts.secret;
  }
  const init: RequestInit = { method, headers };
  if (opts.raw !== undefined) {
    init.body = opts.raw;
  } else if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
  }
  return new Request('http://localhost/api/revalidate', init);
}

beforeEach(() => {
  h.revalidateTagCalls.length = 0;
  process.env.REVALIDATE_SECRET = SECRET;
});

describe('POST /api/revalidate', () => {
  it('revalidates the default tag (store-identity) on an authed request with no body', async () => {
    const res = await POST(makeRequest('POST', { secret: SECRET, raw: '' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, tag: 'store-identity' });
    expect(h.revalidateTagCalls).toEqual([
      { tag: 'store-identity', profile: { expire: 0 } },
    ]);
  });

  it('revalidates an explicit allow-listed tag', async () => {
    const res = await POST(
      makeRequest('POST', { secret: SECRET, body: { tag: 'store-identity' } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, tag: 'store-identity' });
    expect(h.revalidateTagCalls).toEqual([
      { tag: 'store-identity', profile: { expire: 0 } },
    ]);
  });

  it('accepts an optional storeCode alongside the tag', async () => {
    const res = await POST(
      makeRequest('POST', {
        secret: SECRET,
        body: { tag: 'store-identity', storeCode: 'default' },
      }),
    );
    expect(res.status).toBe(200);
    expect(h.revalidateTagCalls).toEqual([
      { tag: 'store-identity', profile: { expire: 0 } },
    ]);
  });

  it('rejects a missing secret header with 401 and does not revalidate', async () => {
    const res = await POST(makeRequest('POST', { body: {} }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects an empty-string secret header with 401 and does not revalidate', async () => {
    const res = await POST(makeRequest('POST', { secret: '', body: {} }));
    expect(res.status).toBe(401);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a wrong secret with 401 and does not revalidate', async () => {
    const res = await POST(
      makeRequest('POST', { secret: 'totally-wrong-secret', body: {} }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a secret that differs only in length (exercises the length-mismatch branch)', async () => {
    const res = await POST(makeRequest('POST', { secret: `${SECRET}-extra`, body: {} }));
    expect(res.status).toBe(401);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a secret that shares a length-matched prefix but differs at the end', async () => {
    const almost = `${SECRET.slice(0, -1)}!`;
    expect(almost.length).toBe(SECRET.length);
    const res = await POST(makeRequest('POST', { secret: almost, body: {} }));
    expect(res.status).toBe(401);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('fails closed (401) when REVALIDATE_SECRET is unset on the server, even with a header present', async () => {
    delete process.env.REVALIDATE_SECRET;
    const res = await POST(makeRequest('POST', { secret: 'anything-at-all', body: {} }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('fails closed (401) when REVALIDATE_SECRET is set to an empty string on the server', async () => {
    process.env.REVALIDATE_SECRET = '';
    const res = await POST(makeRequest('POST', { secret: 'anything-at-all', body: {} }));
    expect(res.status).toBe(401);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a disallowed/unknown tag with 400 and does not revalidate', async () => {
    const res = await POST(
      makeRequest('POST', { secret: SECRET, body: { tag: 'some-other-tag' } }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a malformed (non-JSON) body with 400 and does not revalidate', async () => {
    const res = await POST(
      makeRequest('POST', { secret: SECRET, raw: 'not json at all' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a body whose tag field is the wrong type with 400', async () => {
    const res = await POST(makeRequest('POST', { secret: SECRET, body: { tag: 42 } }));
    expect(res.status).toBe(400);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('rejects a JSON array body with 400', async () => {
    const res = await POST(makeRequest('POST', { secret: SECRET, raw: '[]' }));
    expect(res.status).toBe(400);
    expect(h.revalidateTagCalls).toEqual([]);
  });

  it('auth is checked before body validation: wrong secret + malformed body is still 401, not 400', async () => {
    const res = await POST(
      makeRequest('POST', { secret: 'wrong', raw: 'not json at all' }),
    );
    expect(res.status).toBe(401);
    expect(h.revalidateTagCalls).toEqual([]);
  });
});

describe('non-POST methods on /api/revalidate', () => {
  it.each([
    ['GET', GET],
    ['PUT', PUT],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
    ['HEAD', HEAD],
    ['OPTIONS', OPTIONS],
  ])('%s returns 405 and does not revalidate', async (_label, handler) => {
    const res = await handler();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    expect(h.revalidateTagCalls).toEqual([]);
  });
});
