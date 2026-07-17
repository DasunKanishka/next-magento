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
 *
 * Further extended with the Magento-native store-identity fields
 * (`headerLogoSrc`, `logoAlt`, `copyright`, `storeName`) so the store's
 * identity scalars are backend-sourced rather than hardcoded. These are `null`
 * when Magento returns the field empty/absent — no fabricated default.
 * `headerLogoSrc` is the RAW path Magento returns; resolving it to an absolute
 * URL is out of scope here (owned by `getStoreIdentity`).
 */
export interface StoreConfig {
  storeCode: string;
  locale: string;
  currencyCode: string;
  mediaBaseUrl: string;
  cmsHomePage: string;
  headerLogoSrc: string | null;
  logoAlt: string | null;
  copyright: string | null;
  storeName: string | null;
}

/** The resolved header/footer logo — always render-ready, never a raw path. */
export interface StoreIdentityLogo {
  /** Absolute media URL, already resolved against `StoreConfig.mediaBaseUrl`. `null` when no logo is configured. */
  src: string | null;
  /** Alt text for the logo image; `''` when unset. */
  alt: string;
  /** Store name, for a text-wordmark fallback when `src` is `null`. */
  fallbackText: string;
}

/** A single footer navigation link. */
export interface StoreIdentityFooterLink {
  label: string;
  href: string;
}

/** A footer navigation column: a heading plus its links. */
export interface StoreIdentityFooterColumn {
  heading: string;
  links: StoreIdentityFooterLink[];
}

/** The delivery-promise copy shown alongside the order cut-off time. */
export interface StoreIdentityDeliveryPromise {
  copy: string;
  /** 24h hour (0–23) orders must be placed before to qualify for the promise. */
  cutoffHour: number;
}

/**
 * Canonical store identity — the single backend-agnostic shape every header,
 * footer, and legal-copy consumer reads. Composed by `getStoreIdentity` from
 * the extended `StoreConfig` native scalars plus admin-authorable content
 * (see `composeStoreIdentity` in the Magento adapter's mapper module for the
 * exact per-field source).
 *
 * `name`, `legalEntity`, `registrationNumber`, and `copyright` are the four
 * legal/identity fields: `getStoreIdentity` throws rather than return this
 * shape with any of them missing or defaulted — there is no hardcoded
 * fallback for a legal fact anywhere in this codebase. Every other field
 * degrades to a documented empty value when unauthored.
 */
export interface StoreIdentity {
  name: string;
  logo: StoreIdentityLogo;
  tagline: string;
  registrationNumber: string;
  legalEntity: string;
  copyright: string;
  paymentMethods: string[];
  footerColumns: StoreIdentityFooterColumn[];
  deliveryPromise: StoreIdentityDeliveryPromise;
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

  /**
   * Resolve the store's canonical identity — the composed shape every header,
   * footer, and legal-copy surface reads. Backend-agnostic: the caller never
   * knows whether a field came from a native store-config scalar or an
   * admin-authored content source.
   *
   * THROWS when a legal/identity field (`name`, `legalEntity`,
   * `registrationNumber`, `copyright`) cannot be sourced — no partial or
   * defaulted identity is ever returned for those four fields.
   */
  getStoreIdentity(args: { storeCode: string }): Promise<StoreIdentity>;

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

  /**
   * Subscribe an email address to the store newsletter — the one
   * client-initiated mutation in the surface. `storeCode` + `currency` are
   * passed explicitly so the outbound call is scope-correct like every other
   * backend call (all backend access goes through this interface).
   *
   * The return is a neutral `{ status }` outcome only: the adapter catches any
   * backend/transport error and maps it to `{ status: 'error' }` — a raw
   * backend error, URL, or header MUST NEVER propagate to the caller.
   */
  subscribeToNewsletter(args: {
    email: string;
    storeCode: string;
    currency: string;
  }): Promise<{ status: 'subscribed' | 'error' }>;
}
