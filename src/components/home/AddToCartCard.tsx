'use client';

import React from 'react';

import { ProductCard } from '@/components/ui';
import type { CanonicalProduct } from '@/lib/data-source';
import styles from './AddToCartCard.module.css';

export interface AddToCartCardProps {
  product: CanonicalProduct;
}

/** Percentage-off flag, e.g. "−17%", when a genuine discount is present. */
function discountBadge(product: CanonicalProduct): string | null {
  const original = product.oldPrice?.amount;
  if (original == null || original <= product.price.amount) return null;
  const pct = Math.round((1 - product.price.amount / original) * 100);
  return pct > 0 ? `−${pct}%` : null;
}

/**
 * Wraps the shared product card for the home merchandising grids. Maps the
 * canonical product onto the card, exposes a clickable add control that gives
 * the visitor immediate acknowledgement but performs no basket change (that
 * flow lands in a later version), and surfaces stock so an unavailable line is
 * clearly marked. Price and stock come from a per-request read, so this card is
 * the fresh part of the page.
 */
export function AddToCartCard({ product }: AddToCartCardProps) {
  const [acknowledged, setAcknowledged] = React.useState(false);
  const inStock = product.stockStatus === 'IN_STOCK';

  const handleAdd = React.useCallback(() => {
    setAcknowledged(true);
  }, []);

  const bridge = {
    '--local-status-fg': inStock ? 'var(--color-cta)' : 'var(--color-urgency)',
  } as React.CSSProperties;

  return (
    <div
      data-testid="product-card"
      data-stock={product.stockStatus}
      className={styles.wrap}
    >
      <ProductCard
        brand={product.brand || undefined}
        name={product.name}
        price={product.price.amount}
        oldPrice={product.oldPrice?.amount ?? null}
        reviews={product.reviewCount ?? null}
        saleBadge={discountBadge(product)}
        onAdd={handleAdd}
        className={styles.card}
      />
      <div aria-live="polite" className={styles.status} style={bridge}>
        {!inStock ? 'Tijdelijk uitverkocht' : acknowledged ? 'Toegevoegd ✓' : ''}
      </div>
    </div>
  );
}
