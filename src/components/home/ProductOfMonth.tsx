import React, { Suspense } from 'react';

import { getSlotProducts } from '@/lib/home/home-data';
import type { ProductOfMonthEditorial } from '@/lib/home/editorial';
import { AddToCartCard } from './AddToCartCard';

export interface ProductOfMonthProps {
  editorial: ProductOfMonthEditorial;
}

/** Fetches the single featured product fresh (price/stock) per request. */
async function FeaturedProduct() {
  const [product] = await getSlotProducts('product-of-month', 1);
  if (!product) {
    return (
      <p
        style={{
          font: '400 14px/1.5 var(--font-brand)',
          color: 'var(--color-text-muted)',
        }}
      >
        Er is deze maand nog geen product uitgelicht.
      </p>
    );
  }
  return <AddToCartCard product={product} />;
}

/**
 * Product-of-the-month feature: authored narrative copy beside the single
 * featured product. The copy comes from the cached shell; the product (with its
 * fresh price/stock) streams into the dynamic hole beside it.
 */
export function ProductOfMonth({ editorial }: ProductOfMonthProps) {
  return (
    <section
      aria-label="Product van de maand"
      style={{
        display: 'grid',
        gap: 28,
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        alignItems: 'center',
        background: 'var(--color-surface-inset-b)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'clamp(24px, 4vw, 44px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span
          style={{
            font: '600 12px/1 var(--font-brand)',
            color: 'var(--color-premium-accent-ink)',
            letterSpacing: 'var(--type-eyebrow-tracking)',
            textTransform: 'uppercase',
          }}
        >
          Product van de maand
        </span>
        {editorial.paragraphs.map((paragraph, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              font: '400 16px/1.65 var(--font-brand)',
              color: 'var(--color-text-primary)',
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
      <div>
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              style={{
                height: 320,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
              }}
            />
          }
        >
          <FeaturedProduct />
        </Suspense>
      </div>
    </section>
  );
}
