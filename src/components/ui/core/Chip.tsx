import React from 'react';

export type ChipVariant = 'spec' | 'stock' | 'urgency' | 'award';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** spec = outline attribute pill · stock = dot status · urgency = trust-tinted · award = trust ribbon. */
  variant?: ChipVariant;
  /** Show a leading dot (`--color-cta` for stock, `currentColor` otherwise). */
  dot?: boolean;
}

const BASE_FONT = '500 13px/1 var(--font-brand)';

/**
 * Role-mapping object: assigns each chip variant to its contract tokens.
 * `spec`'s `border: '1px solid #E5DECF'` is preserved as a literal — it is
 * the delivered design's exact value for this outline pill and does not
 * correspond 1:1 to any single contract color token (closest neighbors,
 * `--color-border-field` #D8D3CA and `--color-border-card` #EFE9DE, are
 * both visibly different shades); flagged in the handoff rather than
 * force-mapped to an inexact token.
 */
const VARIANTS: Record<ChipVariant, React.CSSProperties> = {
  spec: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    font: BASE_FONT,
    border: '1px solid #E5DECF',
    background: '#fff',
    color: 'var(--color-text-primary)',
    padding: '7px 13px',
    borderRadius: 'var(--radius-full)',
  },
  stock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    font: '600 14px/1 var(--font-brand)',
    color: 'var(--color-brand)',
  },
  urgency: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    font: '600 13px/1 var(--font-brand)',
    color: 'var(--color-trust)',
    background: 'var(--color-trust-chip)',
    padding: '6px 11px',
    borderRadius: 'var(--radius-sm)',
  },
  award: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    font: '500 12px/1 var(--font-brand)',
    color: 'var(--color-trust-ink)',
    background: 'var(--color-trust-chip)',
    border: '1px solid var(--color-trust-chip-border)',
    padding: '7px 12px',
    borderRadius: 'var(--radius-full)',
  },
};

/** Status & attribute chips: stock, urgency, award ribbon, outline spec pill. */
export function Chip({ variant = 'spec', dot = false, children, style = {}, ...rest }: ChipProps) {
  return (
    <span style={{ ...(VARIANTS[variant] ?? VARIANTS.spec), ...style }} {...rest}>
      {dot ? (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: variant === 'stock' ? 'var(--color-cta)' : 'currentColor',
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
