/**
 * Backend-agnostic canonical data model + the `DataSource` interface.
 *
 * This module is deliberately backend-NEUTRAL: it imports nothing from any
 * concrete adapter (Magento, REST, …) and knows nothing about GraphQL. It is
 * the only shape that crosses into rendering code (architectural rule: all
 * backend access goes through this DataSource interface).
 *
 * `StoreConfig` is extended with `cmsHomePage` so the home page is resolved
 * from Magento's store-view-scoped `storeConfig.cms_home_page` rather than
 * pinned in code.
 */

/** A monetary value carried with its ISO currency code. */
export interface Money {
  amount: number;
  currency: string;
}

/** Canonical product shape. */
export interface CanonicalProduct {
  sku: string;
  name: string;
  urlKey: string;
  brand: string;
  imageUrl: string;
  /** Alt text for the product image (a11y). Maps Magento `small_image.label`; '' when unset. */
  imageAlt: string;
  price: Money;
  oldPrice?: Money;
  /** 0–5 rating. Absent when the product has no reviews. */
  ratingSummary?: number;
  reviewCount?: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
}

/** Canonical category shape. */
export interface CanonicalCategory {
  id: string;
  name: string;
  urlPath: string;
  imageUrl?: string;
  children: CanonicalCategory[];
}

/**
 * Canonical store configuration.
 *
 * Extended with `cmsHomePage` — the frontend resolves the home page from
 * Magento's store-view-scoped `cms_home_page` rather than pinning it in code.
 */
export interface StoreConfig {
  storeCode: string;
  locale: string;
  currencyCode: string;
  mediaBaseUrl: string;
  cmsHomePage: string;
}

/**
 * Canonical CMS block.
 *
 * `content` is admin-authored HTML and crosses a trust boundary — it MUST be
 * sanitized (DOMPurify allow-list) before render and MUST NOT be injected raw
 * via `dangerouslySetInnerHTML`. This module carries the raw string;
 * sanitization is the render layer's responsibility and is out of scope for
 * the connector.
 */
export interface CmsBlock {
  identifier: string;
  title: string;
  content: string;
}

/**
 * The five home-page merchandising slots (`getProductsByMerchandisingSlot`).
 * Each maps to a dedicated, non-navigable curation category in the backend.
 */
export type MerchandisingSlot =
  'highlighted' | 'weekdeals' | 'new-in' | 'featured' | 'product-of-month';

/**
 * Backend-agnostic data access contract (architectural rule: all backend
 * access goes through the `DataSource` interface).
 *
 * Every path from rendering code to a commerce backend goes through this
 * interface. The concrete adapter (Magento GraphQL in V0.1.0) is resolved
 * behind it by the single resolution module (`./index.ts`); no page, component,
 * or handler imports a concrete adapter directly.
 *
 * The interface is intentionally already wider than V0.1.0's Home-only usage
 * (`getNavigationCategories` serves the header/mega-menu). PLP/PDP extension
 * methods (facets, pagination, single-product detail) are OUT_OF_SCOPE for
 * V0.1.0 and are not declared here — they are added in V0.2.0.
 */
export interface DataSource {
  getStoreConfig(args: { storeCode: string }): Promise<StoreConfig>;

  getNavigationCategories(args: {
    storeCode: string;
    currency: string;
    rootCategoryId: number;
  }): Promise<CanonicalCategory[]>;

  getProductsByMerchandisingSlot(args: {
    storeCode: string;
    currency: string;
    slot: MerchandisingSlot;
    limit: number;
  }): Promise<CanonicalProduct[]>;

  getEditorialContent(args: {
    storeCode: string;
    identifiers: string[];
  }): Promise<CmsBlock[]>;
}
