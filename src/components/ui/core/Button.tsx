'use client';

import React from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'color'
> {
  /**
   * Visual style. Only `primary` resolves to `--color-cta` — the single
   * call-to-action color for the whole product. No other variant ever maps
   * its clickable action surface to `--color-brand` (brand/navy is trust
   * identity, never a CTA fill).
   */
  variant?: ButtonVariant;
  /** Control height: `sm` 36px / `md` 44px (`--control-height-md`) / `lg` 56px (`--control-height-lg`, buy-box CTA). */
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Optional leading icon (SVG element). Ignored when `subLabel` is set. */
  iconLeft?: React.ReactNode;
  /** Small secondary line beneath the label, e.g. "Totaal €34,95". Stacks the button content. */
  subLabel?: React.ReactNode;
}

type FilledVariant = Exclude<ButtonVariant, 'link'>;

interface VariantColors {
  bg: string;
  bgHover: string;
  bgActive: string;
  bgDisabled: string;
  fg: string;
  fgDisabled: string;
  border: string;
  borderDisabled: string;
  shadow: string;
}

/**
 * Per-variant color values fed to the module through the `--local-*` bridge.
 * Every value is a `var(--token)` reference, so every color a variant paints
 * stays brand-overridable — no raw color literal lives here or in the module.
 *
 * `primary` is the CTA rule anchor: its fills are exclusively `--color-cta*`.
 * `secondary`/`tertiary` reference `--color-brand` only for border/text, never
 * for a fill a user clicks on; their neutral interactive fills come from the
 * shared `--color-surface-neutral*` family.
 */
const VARIANT_COLORS: Record<FilledVariant, VariantColors> = {
  primary: {
    bg: 'var(--color-cta)',
    bgHover: 'var(--color-cta-hover)',
    bgActive: 'var(--color-cta-active)',
    bgDisabled: 'var(--color-cta-disabled-bg)',
    fg: 'var(--color-text-on-fill)',
    fgDisabled: 'var(--color-cta-disabled-fg)',
    border: 'none',
    borderDisabled: 'none',
    shadow: 'var(--shadow-cta)',
  },
  secondary: {
    bg: 'var(--color-surface)',
    bgHover: 'var(--color-surface-neutral)',
    bgActive: 'var(--color-surface-neutral-emphasis)',
    bgDisabled: 'var(--color-surface)',
    fg: 'var(--color-brand)',
    fgDisabled: 'var(--color-disabled-fg)',
    border: 'var(--border-width-emphasis) solid var(--color-brand)',
    borderDisabled: 'var(--border-width-emphasis) solid var(--color-border-disabled)',
    shadow: 'none',
  },
  tertiary: {
    bg: 'var(--color-surface-neutral)',
    bgHover: 'var(--color-surface-neutral-hover)',
    bgActive: 'var(--color-surface-neutral-active)',
    bgDisabled: 'var(--color-disabled-bg)',
    fg: 'var(--color-brand)',
    fgDisabled: 'var(--color-disabled-fg)',
    border: 'none',
    borderDisabled: 'none',
    shadow: 'none',
  },
};

/**
 * Per-size dimensions fed through the bridge. `md`/`lg` heights resolve to the
 * control-height tokens (44px/56px — both meet the 44×44px minimum touch
 * target). `sm` (36px) is a documented smaller variant for dense, non-primary
 * contexts; use `md` or larger for the primary action on a screen.
 *
 * Off-scale source values are snapped to the nearest token within a ≤2px
 * tolerance so they become brand-overridable: `md` horizontal padding 22px →
 * `--space-6` (24px, +2px); `lg` font-size 16px → `--type-body-size` (15px,
 * −1px). The `sm` height (36px) sits beyond the snap tolerance from the md
 * height, so it has its own token, `--control-height-sm`.
 */
const SIZE_TOKENS: Record<
  ButtonSize,
  { height: string; padX: string; fontSize: string }
> = {
  sm: {
    height: 'var(--control-height-sm)', // 36px
    padX: 'var(--space-4)', // 16px
    fontSize: 'var(--type-caption-size)', // 13px
  },
  md: {
    height: 'var(--control-height-md)', // 44px
    padX: 'var(--space-6)', // 22px → 24px snap
    fontSize: 'var(--type-ui-size)', // 14px
  },
  lg: {
    height: 'var(--control-height-lg)', // 56px
    padX: 'var(--space-7)', // 28px
    fontSize: 'var(--type-body-size)', // 16px → 15px snap
  },
};

/**
 * Primary CTA and button system. One `primary` action per screen;
 * `--color-brand` (navy) is never used as a clickable action surface.
 *
 * Styling follows the co-located CSS module (see src/components/STYLING.md):
 * static tokens and every state rule live in `Button.module.css`; only
 * prop-driven values are passed here, exclusively as `--local-*` bridge
 * properties — never as a direct CSS property with a literal value.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  subLabel = null,
  onClick,
  children,
  style = {},
  ...rest
}: ButtonProps) {
  const s = SIZE_TOKENS[size];

  // Values common to every variant that vary by prop.
  const layoutBridge: Record<string, string> = {
    '--local-direction': subLabel ? 'column' : 'row',
    // Gap snapped to the nearest spacing token (≤2px): stacked 3px →
    // `--space-1` (4px, +1px); inline 9px → `--space-2` (8px, −1px).
    '--local-gap': subLabel ? 'var(--space-1)' : 'var(--space-2)',
    '--local-width': fullWidth ? '100%' : 'auto',
    '--local-font-size': s.fontSize,
    // Standalone weight primitives (not a named type step's weight, which would
    // mis-couple a control's weight to an unrelated text role).
    '--local-font-weight':
      variant === 'primary' ? 'var(--type-weight-bold)' : 'var(--type-weight-semibold)',
  };

  if (variant === 'link') {
    const bridge = {
      ...layoutBridge,
      '--local-fg': 'var(--color-brand)',
      '--local-fg-hover': 'var(--color-trust)',
      '--local-fg-disabled': 'var(--color-disabled-fg)',
    } as React.CSSProperties;

    return (
      <button
        type="button"
        className={`${styles.button} ${styles.link}`}
        data-variant="link"
        data-size={size}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{ ...bridge, ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  const c = VARIANT_COLORS[variant] ?? VARIANT_COLORS.primary;
  const bridge = {
    ...layoutBridge,
    '--local-height': s.height,
    '--local-pad-x': s.padX,
    '--local-bg': c.bg,
    '--local-bg-hover': c.bgHover,
    '--local-bg-active': c.bgActive,
    '--local-bg-disabled': c.bgDisabled,
    '--local-fg': c.fg,
    '--local-fg-disabled': c.fgDisabled,
    '--local-border': c.border,
    '--local-border-disabled': c.borderDisabled,
    '--local-shadow': c.shadow,
  } as React.CSSProperties;

  return (
    <button
      type="button"
      className={styles.button}
      data-variant={variant}
      data-size={size}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...bridge, ...style }}
      {...rest}
    >
      {iconLeft && !subLabel ? <span className={styles.icon}>{iconLeft}</span> : null}
      {subLabel ? (
        <>
          <span>{children}</span>
          <span className={styles.subLabel}>{subLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
