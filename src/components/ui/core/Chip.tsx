import React from 'react';

import styles from './Chip.module.css';

export type ChipVariant = 'spec' | 'stock' | 'urgency' | 'award';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** spec = outline attribute pill · stock = dot status · urgency = trust-tinted · award = trust ribbon. */
  variant?: ChipVariant;
  /** Show a leading dot (`--color-cta` for stock, `currentColor` otherwise). */
  dot?: boolean;
}

/**
 * Role-mapping object: assigns each chip variant to its contract color
 * tokens, fed through the `--local-*` bridge (mirrors Button's
 * `VARIANT_COLORS`). `spec`'s border now resolves to
 * `--color-border-chip-spec` — a dedicated token added for this pill, since
 * neither `--color-border-field` (#D8D3CA) nor `--color-border-card`
 * (#EFE9DE) sits close enough to force-map onto (retiring the former
 * literal-exception comment).
 */
const VARIANTS: Record<ChipVariant, { fg: string; bg: string; border: string }> = {
  spec: {
    fg: 'var(--color-text-primary)',
    bg: 'var(--color-surface)',
    border: 'var(--color-border-chip-spec)',
  },
  stock: {
    fg: 'var(--color-brand)',
    bg: 'none',
    border: 'none',
  },
  urgency: {
    fg: 'var(--color-trust)',
    bg: 'var(--color-trust-chip)',
    border: 'none',
  },
  award: {
    fg: 'var(--color-trust-ink)',
    bg: 'var(--color-trust-chip)',
    border: 'var(--color-trust-chip-border)',
  },
};

/** Status & attribute chips: stock, urgency, award ribbon, outline spec pill. */
export function Chip({
  variant = 'spec',
  dot = false,
  children,
  style = {},
  ...rest
}: ChipProps) {
  const v = VARIANTS[variant] ?? VARIANTS.spec;
  const bridge = {
    '--local-fg': v.fg,
    '--local-bg': v.bg,
    '--local-border': v.border,
    '--local-dot-bg': variant === 'stock' ? 'var(--color-cta)' : 'currentColor',
  } as React.CSSProperties;

  return (
    <span
      className={styles.chip}
      data-variant={variant}
      style={{ ...bridge, ...style }}
      {...rest}
    >
      {dot ? <span className={styles.dot} /> : null}
      {children}
    </span>
  );
}
