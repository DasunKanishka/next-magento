import React, { Suspense } from 'react';

import type { MerchandisingSlot } from '@/lib/data-source';
import { getSlotProducts } from '@/lib/home/home-data';
import { AddToCartCard } from './AddToCartCard';
import { Carousel } from './Carousel';

type RailVariant = 'grid' | 'carousel';

export interface ProductRailProps {
  slot: MerchandisingSlot;
  limit: number;
  heading: string;
  variant: RailVariant;
}

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
};

/** Placeholder cells shown while the fresh price/stock read is in flight. */
function RailSkeleton({ count }: { count: number }) {
  return (
    <div style={GRID_STYLE} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            height: 320,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-inset-b)',
          }}
        />
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
}: {
  slot: MerchandisingSlot;
  limit: number;
  variant: RailVariant;
  heading: string;
}) {
  const products = await getSlotProducts(slot, limit);

  if (products.length === 0) {
    return (
      <p
        style={{
          font: '400 14px/1.5 var(--font-brand)',
          color: 'var(--color-text-muted)',
        }}
      >
        Er zijn op dit moment geen producten in deze selectie.
      </p>
    );
  }

  const cards = products.map((product) => (
    <AddToCartCard key={product.sku} product={product} />
  ));

  if (variant === 'carousel') {
    return <Carousel label={heading}>{cards}</Carousel>;
  }
  return <div style={GRID_STYLE}>{cards}</div>;
}

/**
 * A titled band of merchandising products. The product content is a per-request
 * dynamic hole: it streams in behind a skeleton while the rest of the page (the
 * cached shell) renders immediately.
 */
export function ProductRail({ slot, limit, heading, variant }: ProductRailProps) {
  return (
    <section aria-label={heading}>
      <h2
        style={{
          margin: '0 0 16px',
          font: '700 22px/1.1 var(--font-brand)',
          color: 'var(--color-brand-ink)',
        }}
      >
        {heading}
      </h2>
      <Suspense fallback={<RailSkeleton count={Math.min(limit, 4)} />}>
        <RailItems slot={slot} limit={limit} variant={variant} heading={heading} />
      </Suspense>
    </section>
  );
}
