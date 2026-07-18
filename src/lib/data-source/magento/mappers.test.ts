import { describe, expect, it, vi } from 'vitest';

import type { CmsBlock, StoreConfig } from '@/lib/data-source/types';
import {
  STORE_DELIVERY_PROMISE_BLOCK,
  STORE_FOOTER_COLUMNS_BLOCK,
  STORE_FOOTER_PAYMENT_METHODS_BLOCK,
  STORE_IDENTITY_LEGAL_BLOCK,
  STORE_IDENTITY_TAGLINE_BLOCK,
} from '@/config/store-identity-content';

import {
  composeStoreIdentity,
  mapCategories,
  mapCmsBlocks,
  mapNewsletterStatus,
  mapProduct,
  mapProducts,
  mapStoreConfig,
} from './mappers';

/**
 * Raw fixtures mirror the committed schema snapshot's response shapes for
 * `storeConfig`, `categoryList`, `products` (HomeProductFields) and `cmsBlocks`.
 * These assert the connector-correctness criterion: every raw field maps into
 * the canonical shape with no silently-dropped or `undefined`-passed-through
 * field, including the two required edge cases.
 */

describe('mapStoreConfig', () => {
  it('maps every storeConfig field, including cms_home_page and the identity fields', () => {
    const result = mapStoreConfig({
      store_code: 'default',
      locale: 'nl_NL',
      base_currency_code: 'EUR',
      secure_base_media_url: 'https://249.magento.default/media/',
      cms_home_page: 'home',
      header_logo_src: 'logo/default/logo.svg',
      logo_alt: 'VampireCave',
      copyright: '© VampireCave',
      store_name: 'Default Store View',
    });
    expect(result).toStrictEqual({
      storeCode: 'default',
      locale: 'nl_NL',
      currencyCode: 'EUR',
      mediaBaseUrl: 'https://249.magento.default/media/',
      cmsHomePage: 'home',
      headerLogoSrc: 'logo/default/logo.svg',
      logoAlt: 'VampireCave',
      copyright: '© VampireCave',
      storeName: 'Default Store View',
    });
  });

  it('coalesces null leaves to empty strings (never undefined), and identity fields to null', () => {
    const result = mapStoreConfig({
      store_code: null,
      locale: null,
      base_currency_code: null,
      secure_base_media_url: null,
      cms_home_page: null,
      header_logo_src: null,
      logo_alt: null,
      copyright: null,
      store_name: null,
    });
    expect(result).toStrictEqual({
      storeCode: '',
      locale: '',
      currencyCode: '',
      mediaBaseUrl: '',
      cmsHomePage: '',
      headerLogoSrc: null,
      logoAlt: null,
      copyright: null,
      storeName: null,
    });
    // No field is undefined (identity fields are legitimately null, not undefined).
    for (const value of Object.values(result)) {
      expect(value).not.toBeUndefined();
    }
  });

  it('maps identity fields to null when the raw fields are absent (not just null)', () => {
    const result = mapStoreConfig({
      store_code: 'default',
      locale: 'nl_NL',
      base_currency_code: 'EUR',
      secure_base_media_url: 'https://249.magento.default/media/',
      cms_home_page: 'home',
    });
    expect(result.headerLogoSrc).toBeNull();
    expect(result.logoAlt).toBeNull();
    expect(result.copyright).toBeNull();
    expect(result.storeName).toBeNull();
  });

  it('maps a backend-returned empty string identity field to null (not "")', () => {
    const result = mapStoreConfig({
      store_code: 'default',
      locale: 'nl_NL',
      base_currency_code: 'EUR',
      secure_base_media_url: 'https://249.magento.default/media/',
      cms_home_page: 'home',
      header_logo_src: '',
      logo_alt: '',
      copyright: '© VampireCave',
      store_name: 'Default Store View',
    });
    // '' means "unset" for these optional display strings → normalized to null.
    expect(result.headerLogoSrc).toBeNull();
    expect(result.logoAlt).toBeNull();
    // Non-empty identity values are preserved.
    expect(result.copyright).toBe('© VampireCave');
    expect(result.storeName).toBe('Default Store View');
    // The existing required fields keep their empty-string coalescing contract.
    expect(result.storeCode).toBe('default');
  });
});

describe('mapCategories', () => {
  it('maps id→string, url_path→urlPath, image→imageUrl and nested children', () => {
    const result = mapCategories([
      {
        id: 11,
        name: 'Men',
        url_path: 'men',
        image: 'https://cdn/men.jpg',
        children: [{ id: 12, name: 'Tops', url_path: 'men/tops-men' }],
      },
    ]);
    expect(result).toStrictEqual([
      {
        id: '11',
        name: 'Men',
        urlPath: 'men',
        imageUrl: 'https://cdn/men.jpg',
        children: [{ id: '12', name: 'Tops', urlPath: 'men/tops-men', children: [] }],
      },
    ]);
  });

  it('omits imageUrl entirely when image is null (no undefined passthrough)', () => {
    const [category] = mapCategories([
      { id: 41, name: 'Home Highlighted', url_path: 'home-highlighted', image: null },
    ]);
    expect(category).toStrictEqual({
      id: '41',
      name: 'Home Highlighted',
      urlPath: 'home-highlighted',
      children: [],
    });
    expect('imageUrl' in category).toBe(false);
  });
});

describe('mapProduct', () => {
  const base = {
    sku: 'WSH12',
    name: 'Erika Running Short',
    url_key: 'erika-running-short',
    small_image: { url: 'https://cdn/wsh12.jpg', label: 'Erika Running Short' },
    stock_status: 'IN_STOCK',
  };

  it('maps a discounted product with all fields (rating 0–100 → 0–5)', () => {
    const result = mapProduct({
      ...base,
      price_range: {
        minimum_price: {
          regular_price: { value: 50, currency: 'EUR' },
          final_price: { value: 45, currency: 'EUR' },
        },
      },
      rating_summary: 80,
      review_count: 3,
    });
    expect(result).toStrictEqual({
      sku: 'WSH12',
      name: 'Erika Running Short',
      urlKey: 'erika-running-short',
      brand: '',
      imageUrl: 'https://cdn/wsh12.jpg',
      imageAlt: 'Erika Running Short',
      price: { amount: 45, currency: 'EUR' },
      oldPrice: { amount: 50, currency: 'EUR' },
      ratingSummary: 4,
      reviewCount: 3,
      stockStatus: 'IN_STOCK',
    });
  });

  // Required edge case 1: missing oldPrice (regular price equals final price).
  it('omits oldPrice when regular_price equals final_price', () => {
    const result = mapProduct({
      ...base,
      price_range: {
        minimum_price: {
          regular_price: { value: 45, currency: 'EUR' },
          final_price: { value: 45, currency: 'EUR' },
        },
      },
      rating_summary: 60,
      review_count: 2,
    });
    expect(result.price).toStrictEqual({ amount: 45, currency: 'EUR' });
    expect(result.oldPrice).toBeUndefined();
    expect('oldPrice' in result).toBe(false);
  });

  // Required edge case 2: missing rating_summary (0 / null → no rating).
  it('omits ratingSummary and reviewCount when rating_summary is absent', () => {
    const zero = mapProduct({
      ...base,
      price_range: {
        minimum_price: {
          regular_price: { value: 45, currency: 'EUR' },
          final_price: { value: 45, currency: 'EUR' },
        },
      },
      rating_summary: 0,
      review_count: 0,
    });
    expect(zero.ratingSummary).toBeUndefined();
    expect(zero.reviewCount).toBeUndefined();
    expect('ratingSummary' in zero).toBe(false);
    expect('reviewCount' in zero).toBe(false);

    const nulled = mapProduct({
      ...base,
      price_range: {
        minimum_price: {
          regular_price: { value: 45, currency: 'EUR' },
          final_price: { value: 45, currency: 'EUR' },
        },
      },
      rating_summary: null,
      review_count: null,
    });
    expect(nulled.ratingSummary).toBeUndefined();
    expect(nulled.reviewCount).toBeUndefined();
  });

  it('treats an unknown/missing stock_status as OUT_OF_STOCK (fail-safe)', () => {
    const result = mapProduct({
      ...base,
      stock_status: null,
      price_range: {
        minimum_price: {
          regular_price: { value: 45, currency: 'EUR' },
          final_price: { value: 45, currency: 'EUR' },
        },
      },
    });
    expect(result.stockStatus).toBe('OUT_OF_STOCK');
  });

  it('maps a list via mapProducts', () => {
    const result = mapProducts([
      {
        ...base,
        price_range: {
          minimum_price: {
            regular_price: { value: 45, currency: 'EUR' },
            final_price: { value: 45, currency: 'EUR' },
          },
        },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe('WSH12');
  });
});

describe('mapCmsBlocks', () => {
  it('maps identifier, title and content', () => {
    const result = mapCmsBlocks([
      { identifier: 'home_seo_content', title: 'SEO', content: '<h2>Hi</h2>' },
    ]);
    expect(result).toStrictEqual([
      { identifier: 'home_seo_content', title: 'SEO', content: '<h2>Hi</h2>' },
    ]);
  });

  it('coalesces null title/content to empty strings', () => {
    const [block] = mapCmsBlocks([
      { identifier: 'home_hero', title: null, content: null },
    ]);
    expect(block).toStrictEqual({ identifier: 'home_hero', title: '', content: '' });
  });
});

describe('mapNewsletterStatus', () => {
  it('maps SUBSCRIBED (single opt-in) to subscribed', () => {
    expect(mapNewsletterStatus('SUBSCRIBED')).toBe('subscribed');
  });

  it('maps NOT_ACTIVE (double opt-in pending confirmation) to subscribed', () => {
    expect(mapNewsletterStatus('NOT_ACTIVE')).toBe('subscribed');
  });

  it('maps any other/unknown/absent status to error', () => {
    expect(mapNewsletterStatus('UNSUBSCRIBED')).toBe('error');
    expect(mapNewsletterStatus('UNCONFIRMED')).toBe('error');
    expect(mapNewsletterStatus('SOMETHING_ELSE')).toBe('error');
    expect(mapNewsletterStatus(null)).toBe('error');
    expect(mapNewsletterStatus(undefined)).toBe('error');
  });
});

describe('composeStoreIdentity', () => {
  const validStoreConfig: StoreConfig = {
    storeCode: 'default',
    locale: 'nl_NL',
    currencyCode: 'EUR',
    mediaBaseUrl: 'https://249.magento.default/media/',
    cmsHomePage: 'home',
    headerLogoSrc: 'logo/default/logo.svg',
    logoAlt: 'TopDrinks logo',
    copyright: '© 2026 TopDrinks B.V.',
    storeName: 'TopDrinks',
  };

  function block(identifier: string, content: string): CmsBlock {
    return { identifier, title: '', content };
  }

  const validBlocks: CmsBlock[] = [
    block(STORE_IDENTITY_LEGAL_BLOCK, '<p class="registration-number">KvK 87654321</p>'),
    block(STORE_IDENTITY_TAGLINE_BLOCK, '<p>Jouw online drankspeciaalzaak.</p>'),
    block(
      STORE_FOOTER_PAYMENT_METHODS_BLOCK,
      '<ul><li>iDEAL</li><li>Mastercard</li><li>Visa</li></ul>',
    ),
    block(
      STORE_FOOTER_COLUMNS_BLOCK,
      '<div class="footer-column"><h3>Klantenservice</h3><ul>' +
        '<li><a href="/verzending">Verzending</a></li>' +
        '<li><a href="/retour">Retourneren</a></li>' +
        '</ul></div>' +
        '<div class="footer-column"><h3>Over ons</h3><ul>' +
        '<li><a href="/over-ons">Over ons</a></li>' +
        '</ul></div>',
    ),
    block(
      STORE_DELIVERY_PROMISE_BLOCK,
      '<p class="delivery-copy">Voor 22:00 besteld, morgen in huis</p>' +
        '<p class="delivery-cutoff-hour">22</p>',
    ),
  ];

  it('composes every field from mocked storeConfig + block data', () => {
    const result = composeStoreIdentity({
      storeConfig: validStoreConfig,
      blocks: validBlocks,
    });
    expect(result).toStrictEqual({
      name: 'TopDrinks',
      logo: {
        src: 'https://249.magento.default/media/logo/default/logo.svg',
        alt: 'TopDrinks logo',
        fallbackText: 'TopDrinks',
      },
      tagline: 'Jouw online drankspeciaalzaak.',
      registrationNumber: 'KvK 87654321',
      copyright: '© 2026 TopDrinks B.V.',
      paymentMethods: ['iDEAL', 'Mastercard', 'Visa'],
      footerColumns: [
        {
          heading: 'Klantenservice',
          links: [
            { label: 'Verzending', href: '/verzending' },
            { label: 'Retourneren', href: '/retour' },
          ],
        },
        { heading: 'Over ons', links: [{ label: 'Over ons', href: '/over-ons' }] },
      ],
      deliveryPromise: { copy: 'Voor 22:00 besteld, morgen in huis', cutoffHour: 22 },
    });
  });

  describe('logo URL resolution', () => {
    it('resolves headerLogoSrc to an absolute URL against mediaBaseUrl when a logo is configured', () => {
      const result = composeStoreIdentity({
        storeConfig: validStoreConfig,
        blocks: validBlocks,
      });
      expect(result.logo.src).toBe(
        'https://249.magento.default/media/logo/default/logo.svg',
      );
    });

    it('is null when no logo is configured', () => {
      const result = composeStoreIdentity({
        storeConfig: { ...validStoreConfig, headerLogoSrc: null },
        blocks: validBlocks,
      });
      expect(result.logo.src).toBeNull();
    });

    it('does not double-prefix an already-absolute headerLogoSrc', () => {
      const result = composeStoreIdentity({
        storeConfig: {
          ...validStoreConfig,
          headerLogoSrc: 'https://cdn.example.com/logo.svg',
        },
        blocks: validBlocks,
      });
      expect(result.logo.src).toBe('https://cdn.example.com/logo.svg');
    });

    it('falls back logo.alt to an empty string when logoAlt is null', () => {
      const result = composeStoreIdentity({
        storeConfig: { ...validStoreConfig, logoAlt: null },
        blocks: validBlocks,
      });
      expect(result.logo.alt).toBe('');
    });
  });

  describe('fail-closed legal/identity fields', () => {
    it('throws + logs the marker when name (storeName) is unsourceable', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        composeStoreIdentity({
          storeConfig: { ...validStoreConfig, storeName: null },
          blocks: validBlocks,
        }),
      ).toThrow('store-identity:fail-closed field=name');
      expect(errorSpy).toHaveBeenCalledWith('store-identity:fail-closed field=name');
      errorSpy.mockRestore();
    });

    it('throws + logs the marker when copyright is unsourceable', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        composeStoreIdentity({
          storeConfig: { ...validStoreConfig, copyright: null },
          blocks: validBlocks,
        }),
      ).toThrow('store-identity:fail-closed field=copyright');
      expect(errorSpy).toHaveBeenCalledWith('store-identity:fail-closed field=copyright');
      errorSpy.mockRestore();
    });

    it('throws + logs field=registrationNumber when the whole legal block is missing', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const blocksWithoutLegalBlock = validBlocks.filter(
        (b) => b.identifier !== STORE_IDENTITY_LEGAL_BLOCK,
      );
      expect(() =>
        composeStoreIdentity({
          storeConfig: validStoreConfig,
          blocks: blocksWithoutLegalBlock,
        }),
      ).toThrow('store-identity:fail-closed field=registrationNumber');
      expect(errorSpy).toHaveBeenCalledWith(
        'store-identity:fail-closed field=registrationNumber',
      );
      errorSpy.mockRestore();
    });

    it('throws + logs the marker when the registration-number class is missing from the legal block', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const blocksWithoutRegistration = validBlocks.map((b) =>
        b.identifier === STORE_IDENTITY_LEGAL_BLOCK
          ? block(STORE_IDENTITY_LEGAL_BLOCK, '<p class="other">irrelevant</p>')
          : b,
      );
      expect(() =>
        composeStoreIdentity({
          storeConfig: validStoreConfig,
          blocks: blocksWithoutRegistration,
        }),
      ).toThrow('store-identity:fail-closed field=registrationNumber');
      expect(errorSpy).toHaveBeenCalledWith(
        'store-identity:fail-closed field=registrationNumber',
      );
      errorSpy.mockRestore();
    });

    it('treats an entirely unreachable source (empty storeConfig + no blocks) the same as a missing value', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        composeStoreIdentity({ storeConfig: mapStoreConfig({}), blocks: [] }),
      ).toThrow('store-identity:fail-closed field=name');
      errorSpy.mockRestore();
    });
  });

  describe('non-legal graceful degradation', () => {
    it('tagline degrades to "" when unauthored (no throw)', () => {
      const blocks = validBlocks.filter(
        (b) => b.identifier !== STORE_IDENTITY_TAGLINE_BLOCK,
      );
      const result = composeStoreIdentity({ storeConfig: validStoreConfig, blocks });
      expect(result.tagline).toBe('');
    });

    it('paymentMethods degrades to [] when unauthored (no throw)', () => {
      const blocks = validBlocks.filter(
        (b) => b.identifier !== STORE_FOOTER_PAYMENT_METHODS_BLOCK,
      );
      const result = composeStoreIdentity({ storeConfig: validStoreConfig, blocks });
      expect(result.paymentMethods).toStrictEqual([]);
    });

    it('footerColumns degrades to [] when unauthored (no throw)', () => {
      const blocks = validBlocks.filter(
        (b) => b.identifier !== STORE_FOOTER_COLUMNS_BLOCK,
      );
      const result = composeStoreIdentity({ storeConfig: validStoreConfig, blocks });
      expect(result.footerColumns).toStrictEqual([]);
    });

    it('deliveryPromise degrades to the empty default when entirely unauthored (no throw)', () => {
      const blocks = validBlocks.filter(
        (b) => b.identifier !== STORE_DELIVERY_PROMISE_BLOCK,
      );
      const result = composeStoreIdentity({ storeConfig: validStoreConfig, blocks });
      expect(result.deliveryPromise).toStrictEqual({ copy: '', cutoffHour: 0 });
    });

    it('deliveryPromise degrades atomically (copy without a valid cutoffHour → the empty default, no throw)', () => {
      const blocks = validBlocks.map((b) =>
        b.identifier === STORE_DELIVERY_PROMISE_BLOCK
          ? block(
              STORE_DELIVERY_PROMISE_BLOCK,
              '<p class="delivery-copy">Voor 22:00 besteld, morgen in huis</p>',
            )
          : b,
      );
      const result = composeStoreIdentity({ storeConfig: validStoreConfig, blocks });
      expect(result.deliveryPromise).toStrictEqual({ copy: '', cutoffHour: 0 });
    });
  });
});
