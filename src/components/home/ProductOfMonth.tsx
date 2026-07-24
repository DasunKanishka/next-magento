import React, { Suspense } from 'react';

import { getSlotProducts } from '@/lib/home/home-data';
import type { ProductOfMonthEditorial } from '@/lib/home/editorial';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { AddToCartCard } from './AddToCartCard';
import styles from './ProductOfMonth.module.css';

export interface ProductOfMonthProps {
  editorial: ProductOfMonthEditorial;
  /** Active locale — resolved from `storeConfig` by the caller. */
  locale?: SupportedLocale;
}

/** Fetches the single featured product fresh (price/stock) per request. */
async function FeaturedProduct({ locale }: { locale: SupportedLocale }) {
  const [product] = await getSlotProducts('product-of-month', 1);
  if (!product) {
    return (
      <p className={styles.fallbackNote}>
        {getChromeCopy(locale).productOfMonthEmptyState}
      </p>
    );
  }
  return <AddToCartCard product={product} locale={locale} />;
}

/**
 * Product-of-the-month feature: authored narrative copy beside the single
 * featured product. The copy comes from the cached shell; the product (with its
 * fresh price/stock) streams into the dynamic hole beside it.
 */
export function ProductOfMonth({
  editorial,
  locale = defaultLocale,
}: ProductOfMonthProps) {
  const copy = getChromeCopy(locale);
  return (
    <section aria-label={copy.productOfMonthLabel} className={styles.section}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{copy.productOfMonthLabel}</span>
        {editorial.paragraphs.map((paragraph, i) => (
          <p key={i} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
      <div>
        <Suspense fallback={<div aria-hidden="true" className={styles.fallbackMedia} />}>
          <FeaturedProduct locale={locale} />
        </Suspense>
      </div>
    </section>
  );
}
