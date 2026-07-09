import { describe, expect, it } from 'vitest';

import {
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
  it('maps every storeConfig field, including cms_home_page', () => {
    const result = mapStoreConfig({
      store_code: 'default',
      locale: 'nl_NL',
      base_currency_code: 'EUR',
      secure_base_media_url: 'https://249.magento.default/media/',
      cms_home_page: 'home',
    });
    expect(result).toStrictEqual({
      storeCode: 'default',
      locale: 'nl_NL',
      currencyCode: 'EUR',
      mediaBaseUrl: 'https://249.magento.default/media/',
      cmsHomePage: 'home',
    });
  });

  it('coalesces null leaves to empty strings (never undefined)', () => {
    const result = mapStoreConfig({
      store_code: null,
      locale: null,
      base_currency_code: null,
      secure_base_media_url: null,
      cms_home_page: null,
    });
    expect(result).toStrictEqual({
      storeCode: '',
      locale: '',
      currencyCode: '',
      mediaBaseUrl: '',
      cmsHomePage: '',
    });
    // No field is undefined.
    for (const value of Object.values(result)) {
      expect(value).not.toBeUndefined();
    }
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
