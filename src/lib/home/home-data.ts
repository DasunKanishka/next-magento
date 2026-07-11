import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { getDataSource, type CanonicalProduct } from '@/lib/data-source';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { allSlotCategoryIds } from '@/config/merchandising-slots';
import {
  HOME_CONTENT_ZONES,
  HOME_STRUCTURED_ZONE_IDENTIFIERS,
} from '@/config/content-zones';
import { sanitizeCmsHtml } from '@/lib/sanitize/cms-html';
import type { MerchandisingSlot } from '@/lib/data-source';
import {
  parseBannerTiles,
  parseBusinessReviews,
  parseHeroSlides,
  parseProductOfMonthEditorial,
  type BannerTile,
  type BusinessReviewsContent,
  type HeroSlide,
  type ProductOfMonthEditorial,
} from './editorial';

/** Free-form editorial block authored under the store's home page. */
const SEO_BLOCK_IDENTIFIER = 'home_seo_content';

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
