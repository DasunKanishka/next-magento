import React from 'react';

import styles from './Rating.module.css';

export interface RatingProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Star fill, 0–5 (rounded to whole stars). */
  value?: number;
  /** Number of reviews; renders "<count> reviews" in the subtle-text color. */
  count?: number | null;
  /** Numeric score shown after the stars, e.g. 4.8. */
  score?: number | null;
  /**
   * Star (and score/count) font-size in px. Defaults to `--type-caption-size`
   * (13px). An explicit override — e.g. ProductCard's `size={11}` — is a
   * caller-supplied dynamic value, not a baked brand literal, so it bridges
   * as a plain computed px value (mirroring the Carousel `--local-item-min-w`
   * / FreeShippingProgress `--local-fill-width` precedent) rather than a
   * token, the same escape hatch IconButton's `size` prop documents.
   */
  size?: number;
}

const FULL_STAR = '★';
const EMPTY_STAR = '☆';

/** Gold-accent review stars with optional numeric score + review count. */
export function Rating({
  value = 5,
  count = null,
  score = null,
  size,
  style = {},
  ...rest
}: RatingProps) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const stars = FULL_STAR.repeat(full) + EMPTY_STAR.repeat(5 - full);
  const bridge = {
    '--local-font-size': size != null ? `${size}px` : 'var(--type-caption-size)',
  } as React.CSSProperties;

  return (
    <span
      className={styles.wrap}
      style={{ ...bridge, ...style }}
      aria-label={`${full} out of 5 stars`}
      {...rest}
    >
      <span aria-hidden="true" className={styles.star}>
        {stars}
      </span>
      {score != null ? <span className={styles.score}>{score}</span> : null}
      {count != null ? <span className={styles.count}>{count} reviews</span> : null}
    </span>
  );
}
