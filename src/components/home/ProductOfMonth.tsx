import React, { Suspense } from 'react';

import { getSlotProducts } from '@/lib/home/home-data';
import type { ProductOfMonthEditorial } from '@/lib/home/editorial';
import { AddToCartCard } from './AddToCartCard';
import styles from './ProductOfMonth.module.css';

export interface ProductOfMonthProps {
  editorial: ProductOfMonthEditorial;
}

/** Fetches the single featured product fresh (price/stock) per request. */
async function FeaturedProduct() {
  const [product] = await getSlotProducts('product-of-month', 1);
  if (!product) {
    return (
      <p className={styles.fallbackNote}>Er is deze maand nog geen product uitgelicht.</p>
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
    <section aria-label="Product van de maand" className={styles.section}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Product van de maand</span>
        {editorial.paragraphs.map((paragraph, i) => (
          <p key={i} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
      <div>
        <Suspense fallback={<div aria-hidden="true" className={styles.fallbackMedia} />}>
          <FeaturedProduct />
        </Suspense>
      </div>
    </section>
  );
}
