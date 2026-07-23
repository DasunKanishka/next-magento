import React, { Suspense } from 'react';

import type { MerchandisingSlot } from '@/lib/data-source';
import { getSlotProducts } from '@/lib/home/home-data';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { AddToCartCard } from './AddToCartCard';
import { Carousel } from './Carousel';
import styles from './ProductRail.module.css';

type RailVariant = 'grid' | 'carousel';

export interface ProductRailProps {
  slot: MerchandisingSlot;
  limit: number;
  heading: string;
  variant: RailVariant;
  /** Active locale — resolved from `storeConfig` by the caller. */
  locale?: SupportedLocale;
}

/** Placeholder cells shown while the fresh price/stock read is in flight. */
function RailSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonCell} />
      ))}
    </div>
  );
}

/**
 * Fetches the slot's products on every request (so price and stock are always
 * fresh) and lays them out. Renders a graceful note instead of erroring when a
 * slot has no products.
 */
async function RailItems({
  slot,
  limit,
  variant,
  heading,
  locale,
}: {
  slot: MerchandisingSlot;
  limit: number;
  variant: RailVariant;
  heading: string;
  locale: SupportedLocale;
}) {
  const products = await getSlotProducts(slot, limit);
  const copy = getChromeCopy(locale);

  if (products.length === 0) {
    return <p className={styles.emptyNote}>{copy.productRailEmptyState}</p>;
  }

  const cards = products.map((product) => (
    <AddToCartCard key={product.sku} product={product} locale={locale} />
  ));

  if (variant === 'carousel') {
    return (
      <Carousel
        label={heading}
        prevLabel={copy.carouselPrevLabel}
        nextLabel={copy.carouselNextLabel}
      >
        {cards}
      </Carousel>
    );
  }
  return <div className={styles.grid}>{cards}</div>;
}

/**
 * A titled band of merchandising products. The heading is admin-authored (the
 * slot's own curation-category native name — see `getHomeShellData`), so it
 * is not guaranteed non-empty (e.g. an empty backend): render neither the
 * `<h2>` nor an aria-label when unauthored, rather than a hardcoded fallback.
 * The product content is a per-request dynamic hole: it streams in behind a
 * skeleton while the rest of the page (the cached shell) renders immediately.
 */
export function ProductRail({
  slot,
  limit,
  heading,
  variant,
  locale = defaultLocale,
}: ProductRailProps) {
  const hasHeading = heading.trim() !== '';
  return (
    <section aria-label={hasHeading ? heading : undefined}>
      {hasHeading ? <h2 className={styles.heading}>{heading}</h2> : null}
      <Suspense fallback={<RailSkeleton count={Math.min(limit, 4)} />}>
        <RailItems
          slot={slot}
          limit={limit}
          variant={variant}
          heading={heading}
          locale={locale}
        />
      </Suspense>
    </section>
  );
}
