import React from 'react';

import type { BusinessReviewsContent } from '@/lib/home/editorial';
import styles from './BusinessReviews.module.css';

export interface BusinessReviewsProps {
  content: BusinessReviewsContent;
}

/**
 * Trust band: an aggregate satisfaction score alongside a set of customer
 * testimonials on a deep brand-toned surface. Renders nothing when neither a
 * score nor any testimonial is authored; renders whatever subset is present.
 */
export function BusinessReviews({ content }: BusinessReviewsProps) {
  const { score, basis, testimonials } = content;
  if (!score && testimonials.length === 0) return null;

  return (
    <section aria-label="Klantbeoordelingen" className={styles.section}>
      {score ? (
        <div className={styles.score}>
          <span aria-hidden="true" className={styles.stars}>
            ★★★★★
          </span>
          <strong className={styles.scoreValue}>{score}</strong>
          {basis ? <span className={styles.basis}>{basis}</span> : null}
        </div>
      ) : null}

      {testimonials.map((t, i) => (
        <figure key={t.author || i} className={styles.testimonial}>
          <blockquote className={styles.quote}>{t.quote}</blockquote>
          {t.author ? (
            <figcaption className={styles.author}>{t.author}</figcaption>
          ) : null}
        </figure>
      ))}
    </section>
  );
}
