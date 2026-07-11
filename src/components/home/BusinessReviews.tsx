import React from 'react';

import type { BusinessReviewsContent } from '@/lib/home/editorial';

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
    <section
      aria-label="Klantbeoordelingen"
      style={{
        background: 'var(--color-brand)',
        color: 'var(--color-text-on-brand)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'clamp(24px, 4vw, 44px)',
        display: 'grid',
        gap: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      }}
    >
      {score ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              font: '400 20px/1 var(--font-brand)',
              color: 'var(--color-premium-accent)',
            }}
          >
            ★★★★★
          </span>
          <strong
            style={{
              font: '800 34px/1.05 var(--font-brand)',
              color: '#fff',
            }}
          >
            {score}
          </strong>
          {basis ? (
            <span style={{ font: '400 14px/1.5 var(--font-brand)' }}>{basis}</span>
          ) : null}
        </div>
      ) : null}

      {testimonials.map((t, i) => (
        <figure
          key={t.author || i}
          style={{
            margin: 0,
            padding: 20,
            background: 'var(--color-surface-on-brand)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <blockquote
            style={{
              margin: 0,
              font: '400 15px/1.55 var(--font-brand)',
              color: '#fff',
            }}
          >
            {t.quote}
          </blockquote>
          {t.author ? (
            <figcaption
              style={{
                font: '600 13px/1 var(--font-brand)',
                color: 'var(--color-text-on-brand)',
              }}
            >
              {t.author}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </section>
  );
}
