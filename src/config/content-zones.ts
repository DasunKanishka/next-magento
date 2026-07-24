/**
 * Home content-contract config map.
 *
 * The STRUCTURED, token-themed home zones are identified here as a documented,
 * swappable config map — NOT as string literals scattered through components.
 * Each zone renders as a typed, token-consuming component with a fixed shape
 * contract and a layout cap. Swapping these identifiers per deploy/brand needs
 * no component-code change.
 *
 * NOT in this map:
 *   - `home_seo_content` — free-form editorial with NO shape contract; fetched
 *     via the flexible `cmsBlocks` path (`DataSource.getEditorialContent`) and
 *     sanitized before render. Do not add it here.
 *   - `cmsPage` (generic CMS pages) — OUT_OF_SCOPE for V0.1.0, deferred to
 *     V0.2.0. No zone, query, or codegen target exists for it in this version.
 *
 * The home page itself is resolved config-driven from `storeConfig.cms_home_page`
 * (canonical `StoreConfig.cmsHomePage`), not pinned here.
 */

/** A structured home zone: its stable backend identifier + its layout cap. */
export interface ContentZone {
  /** Stable Magento CMS block identifier the zone is authored under. */
  readonly identifier: string;
  /** Human-readable purpose (documentation + admin cross-reference). */
  readonly description: string;
  /**
   * Maximum number of content items the zone renders (layout cap). The
   * frontend renders present content UP TO this cap.
   */
  readonly maxItems: number;
}

/**
 * Canonical structured-zone keys. Kept as a const tuple so `HomeZoneKey`
 * derives from it and every lookup is exhaustively type-checked.
 */
export const HOME_ZONE_KEYS = [
  'hero',
  'banners1',
  'banners2',
  'banners3',
  'businessReviews',
  'productOfMonthEditorial',
  'statCallouts',
] as const;

export type HomeZoneKey = (typeof HOME_ZONE_KEYS)[number];

/** The structured home zone contract map. */
export const HOME_CONTENT_ZONES: Record<HomeZoneKey, ContentZone> = {
  hero: {
    identifier: 'home_hero',
    description: 'Rotating hero campaign slider.',
    maxItems: 5,
  },
  banners1: {
    identifier: 'home_banners_1',
    description: 'Editorial banner tile set 1 (below highlighted products).',
    maxItems: 4,
  },
  banners2: {
    identifier: 'home_banners_2',
    description: 'Editorial banner tile set 2 (below weekdeals carousel).',
    maxItems: 4,
  },
  banners3: {
    identifier: 'home_banners_3',
    description: 'Editorial banner tile set 3 (below featured carousel).',
    maxItems: 4,
  },
  businessReviews: {
    identifier: 'home_business_reviews',
    description: 'Aggregate score + up to 3 testimonial cards (navy band).',
    maxItems: 3,
  },
  productOfMonthEditorial: {
    identifier: 'home_product_of_month_editorial',
    description: 'Narrative editorial copy for the product-of-the-month hero.',
    maxItems: 1,
  },
  statCallouts: {
    identifier: 'home_stat_callouts',
    description:
      'Headline proof-point figures (e.g. assortment size, rating, delivery promise) shown above the SEO copy panel.',
    maxItems: 3,
  },
};

/** All structured-zone identifiers, e.g. for a single batched fetch. */
export const HOME_STRUCTURED_ZONE_IDENTIFIERS: string[] = HOME_ZONE_KEYS.map(
  (key) => HOME_CONTENT_ZONES[key].identifier,
);

/**
 * Free-form editorial block authored under the store's home page. NOT a
 * structured zone (it has no shape contract — see this file's header), so it
 * is fetched via the flexible `cmsBlocks` path separately from
 * `HOME_STRUCTURED_ZONE_IDENTIFIERS`. Lives here (a non-`server-only` config
 * module) so both the server data layer and the E2E harness can reference the
 * one identifier without pulling in a `server-only` module.
 */
export const HOME_SEO_BLOCK_IDENTIFIER = 'home_seo_content';
