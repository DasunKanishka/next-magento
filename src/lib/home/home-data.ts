import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { getDataSource, type CanonicalProduct } from '@/lib/data-source';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { allSlotCategoryIds, resolveSlotCategoryId } from '@/config/merchandising-slots';
import {
  HOME_CONTENT_ZONES,
  HOME_SEO_BLOCK_IDENTIFIER,
  HOME_STRUCTURED_ZONE_IDENTIFIERS,
} from '@/config/content-zones';
import { sanitizeCmsHtml } from '@/lib/sanitize/cms-html';
import type { MerchandisingSlot } from '@/lib/data-source';
import {
  parseBannerTiles,
  parseBusinessReviews,
  parseHeroSlides,
  parseProductOfMonthEditorial,
  parseStatCallouts,
  type BannerTile,
  type BusinessReviewsContent,
  type HeroSlide,
  type ProductOfMonthEditorial,
  type StatCallout,
} from './editorial';

/**
 * The four merchandising slots that render a plain-text rail heading (the
 * fifth slot, `product-of-month`, has its own narrative editorial zone and no
 * rail heading — see `ProductOfMonth`).
 */
const RAIL_HEADING_SLOTS = ['highlighted', 'weekdeals', 'new-in', 'featured'] as const;

/** A merchandising slot that renders a plain-text rail heading. */
export type RailHeadingSlot = (typeof RAIL_HEADING_SLOTS)[number];

/** Free-form editorial block authored under the store's home page (config-sourced). */
const SEO_BLOCK_IDENTIFIER = HOME_SEO_BLOCK_IDENTIFIER;

/** Simple navigable category shape for the "shop by category" bar. */
export interface HomeCategory {
  id: string;
  name: string;
  urlPath: string;
}

/**
 * The cacheable, per-request-invariant part of the home page: the resolved
 * home-page route, the live navigable category set, and every editorial zone.
 * Product price/stock is deliberately NOT here — it is read fresh per request
 * (see `getSlotProducts`) so this shell can be reused across requests.
 */
export interface HomeShellData {
  /** The store's configured home-page route (from store config, not pinned). */
  homeRoute: string;
  /** True when the requested route is the store's configured home page. */
  isConfiguredHome: boolean;
  categories: HomeCategory[];
  hero: HeroSlide[];
  banners1: BannerTile[];
  banners2: BannerTile[];
  banners3: BannerTile[];
  reviews: BusinessReviewsContent;
  productOfMonth: ProductOfMonthEditorial;
  /** Sanitized free-form editorial HTML for the search-optimised copy block. */
  seoHtml: string;
  /** Headline proof-point figures shown above the SEO copy panel. */
  statCallouts: StatCallout[];
  /**
   * Rail heading text per merchandising slot, sourced from the slot's own
   * curation-category NATIVE `name` (Magento requires every category to carry
   * one — there is no separate CMS block to author). Resolved alongside the
   * category tree fetch (`getNavigationCategories`), not a second call.
   * Empty string when the category is absent (e.g. an empty backend) — the
   * caller renders no heading rather than a hardcoded fallback.
   */
  railHeadings: Record<RailHeadingSlot, string>;
}

function blockContent(
  blocks: { identifier: string; content: string }[],
  identifier: string,
): string {
  return blocks.find((b) => b.identifier === identifier)?.content ?? '';
}

/**
 * Assemble the cached home shell. The whole result is tagged `home-shell` so a
 * content change can revalidate it without a redeploy; a short refresh window
 * keeps editorial reasonably fresh while still absorbing request bursts.
 */
export async function getHomeShellData(requestedRoute = 'home'): Promise<HomeShellData> {
  'use cache';
  cacheTag('home-shell');
  cacheLife('minutes');

  const dataSource = getDataSource();
  const { storeCode, currency, storeConfig } = await resolveStoreContext();

  const [rawCategories, editorial, seoBlocks] = await Promise.all([
    dataSource.getNavigationCategories({
      storeCode,
      currency,
      rootCategoryId: 2,
    }),
    dataSource.getEditorialContent({
      storeCode,
      identifiers: HOME_STRUCTURED_ZONE_IDENTIFIERS,
    }),
    dataSource.getEditorialContent({
      storeCode,
      identifiers: [SEO_BLOCK_IDENTIFIER],
    }),
  ]);

  const slotIds = allSlotCategoryIds();
  const categories: HomeCategory[] = rawCategories
    .filter((c) => !slotIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, urlPath: c.urlPath }));

  // Rail headings read straight off the ALREADY-FETCHED category tree (the
  // merchandising slot categories are present in `rawCategories` before the
  // filter above removes them from the navigable set) — no second call.
  const categoryNameById = new Map(rawCategories.map((c) => [c.id, c.name]));
  const railHeadings = Object.fromEntries(
    RAIL_HEADING_SLOTS.map((slot) => [
      slot,
      categoryNameById.get(resolveSlotCategoryId(slot)) ?? '',
    ]),
  ) as Record<RailHeadingSlot, string>;

  const zone = (key: keyof typeof HOME_CONTENT_ZONES) => HOME_CONTENT_ZONES[key];

  return {
    homeRoute: storeConfig.cmsHomePage,
    isConfiguredHome: storeConfig.cmsHomePage === requestedRoute,
    categories,
    hero: parseHeroSlides(
      blockContent(editorial, zone('hero').identifier),
      zone('hero').maxItems,
    ),
    banners1: parseBannerTiles(
      blockContent(editorial, zone('banners1').identifier),
      zone('banners1').maxItems,
    ),
    banners2: parseBannerTiles(
      blockContent(editorial, zone('banners2').identifier),
      zone('banners2').maxItems,
    ),
    banners3: parseBannerTiles(
      blockContent(editorial, zone('banners3').identifier),
      zone('banners3').maxItems,
    ),
    reviews: parseBusinessReviews(
      blockContent(editorial, zone('businessReviews').identifier),
      zone('businessReviews').maxItems,
    ),
    productOfMonth: parseProductOfMonthEditorial(
      blockContent(editorial, zone('productOfMonthEditorial').identifier),
    ),
    seoHtml: sanitizeCmsHtml(blockContent(seoBlocks, SEO_BLOCK_IDENTIFIER)),
    statCallouts: parseStatCallouts(
      blockContent(editorial, zone('statCallouts').identifier),
      zone('statCallouts').maxItems,
    ),
    railHeadings,
  };
}

/**
 * Products for one merchandising slot, read fresh on every request so price and
 * stock are never served from the cached shell. This is the dynamic hole the
 * product grids stream into.
 */
export async function getSlotProducts(
  slot: MerchandisingSlot,
  limit: number,
): Promise<CanonicalProduct[]> {
  const dataSource = getDataSource();
  const { storeCode, currency } = await resolveStoreContext();
  return dataSource.getProductsByMerchandisingSlot({
    storeCode,
    currency,
    slot,
    limit,
  });
}
