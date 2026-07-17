import type {
  CanonicalCategory,
  CanonicalProduct,
  CmsBlock,
  StoreConfig,
} from '@/lib/data-source/types';

/**
 * Pure raw-response → canonical-model mapping functions for the Magento
 * adapter. Kept free of any I/O or `graphql-request` dependency so they are
 * directly unit-testable with plain objects.
 *
 * Every field the committed schema snapshot returns for `storeConfig`,
 * `categoryList`, `products` (`HomeProductFields`) and `cmsBlocks` is mapped
 * explicitly below — nothing is silently dropped or passed through as
 * `undefined`.
 *
 * Magento leaf fields are largely nullable in the schema; every access
 * coalesces so a canonical non-optional field is never `undefined`.
 */

// --- Raw input shapes (structurally match the codegen query result types) ---

interface RawPriceValue {
  value?: number | null;
  currency?: string | null;
}

interface RawHomeProduct {
  sku?: string | null;
  name?: string | null;
  url_key?: string | null;
  small_image?: { url?: string | null; label?: string | null } | null;
  price_range: {
    minimum_price: {
      regular_price: RawPriceValue;
      final_price: RawPriceValue;
    };
  };
  rating_summary?: number | null;
  review_count?: number | null;
  stock_status?: string | null;
}

interface RawCategory {
  id?: number | null;
  name?: string | null;
  url_path?: string | null;
  image?: string | null;
  children?: (RawCategory | null)[] | null;
}

interface RawStoreConfig {
  store_code?: string | null;
  locale?: string | null;
  base_currency_code?: string | null;
  secure_base_media_url?: string | null;
  cms_home_page?: string | null;
  header_logo_src?: string | null;
  logo_alt?: string | null;
  copyright?: string | null;
  store_name?: string | null;
}

interface RawCmsBlock {
  identifier?: string | null;
  title?: string | null;
  content?: string | null;
}

// --- Mappers ---

export function mapStoreConfig(raw: RawStoreConfig): StoreConfig {
  return {
    storeCode: raw.store_code ?? '',
    locale: raw.locale ?? '',
    currencyCode: raw.base_currency_code ?? '',
    mediaBaseUrl: raw.secure_base_media_url ?? '',
    cmsHomePage: raw.cms_home_page ?? '',
    // Store-identity fields: `null` (not '') when Magento returns the field
    // empty/absent — these are optional display scalars, not required for the
    // cache-key/home-page-resolution role the existing fields above play, so
    // no fabricated default is appropriate here. `|| null` (not `?? null`)
    // normalizes a backend-returned empty string '' to null too — for these
    // optional strings '' is the only falsy value and it means "unset".
    headerLogoSrc: raw.header_logo_src || null,
    logoAlt: raw.logo_alt || null,
    copyright: raw.copyright || null,
    storeName: raw.store_name || null,
  };
}

export function mapCategory(raw: RawCategory): CanonicalCategory {
  const category: CanonicalCategory = {
    id: raw.id != null ? String(raw.id) : '',
    name: raw.name ?? '',
    urlPath: raw.url_path ?? '',
    children: (raw.children ?? [])
      .filter((child): child is RawCategory => child != null)
      .map(mapCategory),
  };
  // `image` is optional in the canonical model — set only when present so we
  // never pass `imageUrl: undefined` through explicitly.
  if (raw.image != null && raw.image !== '') {
    category.imageUrl = raw.image;
  }
  return category;
}

export function mapCategories(raw: RawCategory[]): CanonicalCategory[] {
  return raw.map(mapCategory);
}

function toStockStatus(raw?: string | null): CanonicalProduct['stockStatus'] {
  // Fail-safe: anything not explicitly IN_STOCK is treated as OUT_OF_STOCK so a
  // missing/unknown status never presents an unbuyable product as buyable.
  return raw === 'IN_STOCK' ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

export function mapProduct(raw: RawHomeProduct): CanonicalProduct {
  const minimum = raw.price_range.minimum_price;
  const finalPrice = minimum.final_price;
  const regularPrice = minimum.regular_price;

  const currency = finalPrice.currency ?? regularPrice.currency ?? '';
  const finalAmount = finalPrice.value ?? 0;
  const regularAmount = regularPrice.value ?? finalAmount;

  const product: CanonicalProduct = {
    sku: raw.sku ?? '',
    name: raw.name ?? '',
    urlKey: raw.url_key ?? '',
    // HomeProductFields carries no brand attribute; the canonical `brand` has no
    // source field in this fragment (known gap — documented here deliberately).
    brand: '',
    imageUrl: raw.small_image?.url ?? '',
    // `small_image.label` is Magento's image alt text — mapped for a11y so no
    // fetched field is dropped. '' when the backend supplies no label.
    imageAlt: raw.small_image?.label ?? '',
    price: { amount: finalAmount, currency },
    stockStatus: toStockStatus(raw.stock_status),
  };

  // oldPrice: present only when there is a genuine discount (regular > final).
  // Equal prices → no oldPrice (the "missing oldPrice" edge case).
  if (regularPrice.value != null && regularAmount > finalAmount) {
    product.oldPrice = { amount: regularAmount, currency };
  }

  // ratingSummary: Magento `rating_summary` is a 0–100 percentage; canonical is
  // 0–5. A value of 0 / null means "no reviews" → omit (the "missing
  // rating_summary" edge case).
  if (raw.rating_summary != null && raw.rating_summary > 0) {
    product.ratingSummary = raw.rating_summary / 20;
  }

  if (raw.review_count != null && raw.review_count > 0) {
    product.reviewCount = raw.review_count;
  }

  return product;
}

export function mapProducts(raw: RawHomeProduct[]): CanonicalProduct[] {
  return raw.map(mapProduct);
}

export function mapCmsBlock(raw: RawCmsBlock): CmsBlock {
  return {
    identifier: raw.identifier ?? '',
    title: raw.title ?? '',
    content: raw.content ?? '',
  };
}

export function mapCmsBlocks(raw: RawCmsBlock[]): CmsBlock[] {
  return raw.map(mapCmsBlock);
}

/**
 * Map the backend newsletter-subscribe status enum to the neutral
 * `{ status: 'subscribed' | 'error' }` contract.
 *
 * Both `SUBSCRIBED` (single opt-in complete) and `NOT_ACTIVE` (double opt-in
 * pending a confirmation email) are success outcomes — the address was
 * accepted and a confirmation flow started. Any other value (including
 * `null`/`undefined` or an unknown status) maps to `'error'` so the caller
 * never over-reports success. This is a pure function so the success/error
 * mapping is unit-testable without any I/O.
 */
export function mapNewsletterStatus(raw?: string | null): 'subscribed' | 'error' {
  return raw === 'SUBSCRIBED' || raw === 'NOT_ACTIVE' ? 'subscribed' : 'error';
}
