import React from 'react';

export interface RatingProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Star fill, 0–5 (rounded to whole stars). */
  value?: number;
  /** Number of reviews; renders "<count> reviews" in the subtle-text color. */
  count?: number | null;
  /** Numeric score shown after the stars, e.g. 4.8. */
  score?: number | null;
  /** Star font-size in px. */
  size?: number;
}

const FULL_STAR = '★';
const EMPTY_STAR = '☆';

/** Gold-accent review stars with optional numeric score + review count. */
export function Rating({
  value = 5,
  count = null,
  score = null,
  size = 13,
  style = {},
  ...rest
}: RatingProps) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const stars = FULL_STAR.repeat(full) + EMPTY_STAR.repeat(5 - full);
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}
      aria-label={`${full} out of 5 stars`}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{
          color: 'var(--color-premium-accent)',
          fontSize: size,
          letterSpacing: '1px',
          lineHeight: 1,
        }}
      >
        {stars}
      </span>
      {score != null ? (
        <span style={{ font: `600 ${size}px/1 var(--font-brand)`, color: 'var(--color-brand-ink)' }}>
          {score}
        </span>
      ) : null}
      {count != null ? (
        <span style={{ font: `500 ${size}px/1 var(--font-brand)`, color: 'var(--color-text-subtle)' }}>
          {count} reviews
        </span>
      ) : null}
    </span>
  );
}
