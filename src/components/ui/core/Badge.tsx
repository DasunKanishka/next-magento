import React from 'react';

export type BadgeVariant = 'sale' | 'new' | 'tip' | 'deals' | 'bestseller';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Role of the badge. sale/deals → urgency, new/bestseller → brand, tip → premium accent. */
  variant?: BadgeVariant;
}

/**
 * Role-mapping object: assigns each badge variant to its contract token +
 * on-fill text color. `color: '#fff'` is the on-fill text treatment shared
 * by every variant (no contract token names this role) — literal per the
 * role-map exception.
 */
const VARIANTS: Record<BadgeVariant, { bg: string; color: string }> = {
  sale: { bg: 'var(--color-urgency)', color: '#fff' },
  new: { bg: 'var(--color-brand)', color: '#fff' },
  tip: { bg: 'var(--color-premium-accent)', color: '#fff' },
  deals: { bg: 'var(--color-urgency)', color: '#fff' },
  bestseller: { bg: 'var(--color-brand)', color: '#fff' },
};

/** Small rectangular flag label for product/nav flags (−17%, Nieuw, Bestseller, 🔥 Deals). */
export function Badge({ variant = 'sale', children, style = {}, ...rest }: BadgeProps) {
  const v = VARIANTS[variant] ?? VARIANTS.sale;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: v.bg,
        color: v.color,
        font: '600 12px/1 var(--font-brand)',
        padding: '6px 11px',
        borderRadius: 'var(--radius-xs)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
