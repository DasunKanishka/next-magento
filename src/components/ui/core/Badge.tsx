import React from 'react';

import styles from './Badge.module.css';

export type BadgeVariant = 'sale' | 'new' | 'tip' | 'deals' | 'bestseller';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Role of the badge. sale/deals → urgency, new/bestseller → brand, tip → premium accent. */
  variant?: BadgeVariant;
}

/**
 * Role-mapping object: assigns each badge variant to its contract fill +
 * on-fill text color tokens. Every value is a `var(--token)` reference fed
 * through the `--local-*` bridge (see Button's `VARIANT_COLORS` for the same
 * pattern) — none is a raw literal, so every badge color stays
 * brand-overridable.
 */
const VARIANTS: Record<BadgeVariant, { bg: string; fg: string }> = {
  sale: { bg: 'var(--color-urgency)', fg: 'var(--color-text-on-fill)' },
  new: { bg: 'var(--color-brand)', fg: 'var(--color-text-on-fill)' },
  tip: { bg: 'var(--color-premium-accent)', fg: 'var(--color-text-on-fill)' },
  deals: { bg: 'var(--color-urgency)', fg: 'var(--color-text-on-fill)' },
  bestseller: { bg: 'var(--color-brand)', fg: 'var(--color-text-on-fill)' },
};

/** Small rectangular flag label for product/nav flags (−17%, Nieuw, Bestseller, 🔥 Deals). */
export function Badge({ variant = 'sale', children, style = {}, ...rest }: BadgeProps) {
  const v = VARIANTS[variant] ?? VARIANTS.sale;
  const bridge = {
    '--local-bg': v.bg,
    '--local-fg': v.fg,
  } as React.CSSProperties;

  return (
    <span className={styles.badge} style={{ ...bridge, ...style }} {...rest}>
      {children}
    </span>
  );
}
