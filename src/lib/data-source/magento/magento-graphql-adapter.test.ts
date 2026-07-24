import { ClientError } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STORE_IDENTITY_LEGAL_BLOCK } from '@/config/store-identity-content';

/**
 * Unit tests for the partial-error recovery `fetchEditorialBlocksResilient`
 * (magento-graphql-adapter.ts) — the compliance-critical branch that decides
 * whether a batched CMS-block fetch degrades gracefully (one missing
 * identifier) or fail-closes (a REQUIRED field genuinely unsourceable).
 * Exercised at BOTH its call sites: `loadStoreIdentity` (identity content —
 * `getStoreIdentity`) and the `getEditorialContent` adapter method
 * (home/header editorial zones).
 *
 * `next/cache`'s `cacheTag`/`cacheLife` are mocked as no-ops (same convention
 * as `src/app/api/revalidate/route.test.ts`) — there is no repo precedent for
 * (nor need to) actually exercise Next's `'use cache'` compiler transform
 * here: that transform only runs under `next build`/`next dev`, never under
 * Vitest, so `loadStoreIdentity`'s `'use cache'` directive is already inert
 * (an ordinary top-level string-literal statement) in this test file — only
 * the two `next/cache` FUNCTION CALLS need a safe no-op stand-in. What this
 * file actually mocks is one layer lower: `./client`'s `getMagentoClient`, so
 * the adapter's OWN request/response/error-recovery logic runs for real
 * against a fake `GraphQLClient`.
 */

const h = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  cacheTag: () => {},
  cacheLife: () => {},
}));

vi.mock('./client', () => ({
  getMagentoClient: () => ({ request: h.requestMock }),
}));

// Imported AFTER the mocks so the module under test picks up the mocked
// `next/cache` + `./client`.
const { loadStoreIdentity, magentoGraphQLAdapter } =
  await import('./magento-graphql-adapter');

/** A `storeConfig` response with both fail-closed scalars (`name`, `copyright`) present — every test below is isolated to the BLOCKS fetch, never this one. */
const VALID_STORE_CONFIG_RESPONSE = {
  storeConfig: {
    store_code: 'default',
    locale: 'en_US',
    base_currency_code: 'EUR',
    secure_base_media_url: 'https://249.magento.default/media/',
    cms_home_page: 'home',
    header_logo_src: null,
    logo_alt: null,
    copyright: 'Example Store B.V.',
    store_name: 'Example Store',
  },
};

/** The `store_identity_legal` block, carrying a `.registration-number` span (the one REQUIRED CMS-sourced field). */
const LEGAL_BLOCK_ITEM = {
  identifier: STORE_IDENTITY_LEGAL_BLOCK,
  title: '',
  content: '<span class="registration-number">KvK 12345678</span>',
};

/** A different, non-required block — stands in for "some OTHER identifier resolved fine". */
const TAGLINE_BLOCK_ITEM = {
  identifier: 'store_identity_tagline',
  title: '',
  content: '<p>A tagline.</p>',
};

/** Builds a real `ClientError` carrying the given partial `data`, mirroring what `graphql-request` throws on ANY top-level GraphQL `errors` entry. */
function partialClientError(items: (typeof LEGAL_BLOCK_ITEM | null)[]) {
  return new ClientError(
    {
      data: { cmsBlocks: { items } },
      // A minimal stand-in for graphql's `GraphQLError` shape — only
      // `message` matters to this test (the adapter never reads `errors`,
      // only recovers `response.data`); the full class shape isn't needed.
      errors: [
        { message: 'The CMS block with the "x" ID doesn\'t exist.' },
      ] as unknown as ConstructorParameters<typeof ClientError>[0]['errors'],
      status: 200,
      headers: new Headers(),
      body: '',
    },
    {
      query:
        'query EditorialBlocks($identifiers: [String]!) { cmsBlocks(identifiers: $identifiers) { items { identifier title content } } }',
    },
  );
}

beforeEach(() => {
  h.requestMock.mockReset();
});

describe('loadStoreIdentity — partial-error recovery (fetchEditorialBlocksResilient)', () => {
  it('(a) partial data WITH the required legal block present → no throw; the optional alcohol-notice block degrades to empty', async () => {
    h.requestMock
      .mockResolvedValueOnce(VALID_STORE_CONFIG_RESPONSE)
      .mockRejectedValueOnce(partialClientError([LEGAL_BLOCK_ITEM]));

    const result = await loadStoreIdentity({ storeCode: 'default' });

    expect(result.registrationNumber).toBe('KvK 12345678');
    expect(result.alcoholLegalNotice).toBe('');
  });

  it('(b) partial data WITHOUT the required legal block → fail-closed throw (requireLegalField)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.requestMock
      .mockResolvedValueOnce(VALID_STORE_CONFIG_RESPONSE)
      .mockRejectedValueOnce(partialClientError([TAGLINE_BLOCK_ITEM]));

    await expect(loadStoreIdentity({ storeCode: 'default' })).rejects.toThrow(
      'store-identity:fail-closed field=registrationNumber',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'store-identity:fail-closed field=registrationNumber',
    );
    errorSpy.mockRestore();
  });

  it('(c) a non-ClientError transport error → blocks=[] → fail-closed throw (same outcome as a total outage)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.requestMock
      .mockResolvedValueOnce(VALID_STORE_CONFIG_RESPONSE)
      .mockRejectedValueOnce(new Error('ECONNRESET'));

    await expect(loadStoreIdentity({ storeCode: 'default' })).rejects.toThrow(
      'store-identity:fail-closed field=registrationNumber',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'store-identity:fail-closed field=registrationNumber',
    );
    errorSpy.mockRestore();
  });

  it('baseline sanity: no error at all still resolves every field (proves the mock harness itself is not what makes (a)–(c) pass)', async () => {
    h.requestMock
      .mockResolvedValueOnce(VALID_STORE_CONFIG_RESPONSE)
      .mockResolvedValueOnce({
        cmsBlocks: { items: [LEGAL_BLOCK_ITEM] },
      });

    const result = await loadStoreIdentity({ storeCode: 'default' });
    expect(result.registrationNumber).toBe('KvK 12345678');
    expect(result.name).toBe('Example Store');
  });
});

describe('getEditorialContent — partial-error recovery (shared fetchEditorialBlocksResilient)', () => {
  it('partial data (one identifier missing, others found) degrades to the FOUND items only — no throw', async () => {
    h.requestMock.mockRejectedValueOnce(partialClientError([TAGLINE_BLOCK_ITEM]));

    const result = await magentoGraphQLAdapter.getEditorialContent({
      storeCode: 'default',
      identifiers: ['store_identity_tagline', 'home_not_yet_authored'],
    });

    expect(result).toEqual([
      { identifier: 'store_identity_tagline', title: '', content: '<p>A tagline.</p>' },
    ]);
  });

  it('a non-ClientError transport error degrades to [] (never throws)', async () => {
    h.requestMock.mockRejectedValueOnce(new Error('ECONNRESET'));

    const result = await magentoGraphQLAdapter.getEditorialContent({
      storeCode: 'default',
      identifiers: ['home_hero'],
    });

    expect(result).toEqual([]);
  });

  it('baseline sanity: no error at all still returns every requested item that resolved', async () => {
    h.requestMock.mockResolvedValueOnce({
      cmsBlocks: { items: [LEGAL_BLOCK_ITEM, TAGLINE_BLOCK_ITEM] },
    });

    const result = await magentoGraphQLAdapter.getEditorialContent({
      storeCode: 'default',
      identifiers: [STORE_IDENTITY_LEGAL_BLOCK, 'store_identity_tagline'],
    });

    expect(result).toHaveLength(2);
  });
});
