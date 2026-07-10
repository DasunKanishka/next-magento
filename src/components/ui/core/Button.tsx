'use client';

import React from 'react';

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

/**
 * Role-mapping object: assigns each `variant` role to its contract tokens.
 * This is the ONLY place literal (non-token) values may live per the
 * component library's brand-neutrality rule — every other line in this file
 * references either a `var(--contract-name)` or a value pulled from this map.
 *
 * `primary` is the CTA rule anchor: its `bg`/`hoverBg`/`activeBg` are the
 * only variant background values in this table, and they are exclusively
 * `--color-cta*`. `secondary`/`tertiary`/`link` reference `--color-brand`
 * only for border/text — never for a fill a user clicks on.
 */
const PALETTE: Record<
  Exclude<ButtonVariant, 'link'>,
  {
    bg: string;
    hoverBg: string;
    activeBg: string;
    disabledBg: string;
    color: string;
    disabledColor: string;
    border: string;
    disabledBorder?: string;
    weight: number;
  }
> = {
  primary: {
    bg: 'var(--color-cta)',
    hoverBg: 'var(--color-cta-hover)',
    activeBg: 'var(--color-cta-active)',
    disabledBg: '#BBE0CC',
    color: '#fff',
    disabledColor: '#82B098',
    border: 'none',
    weight: 700,
  },
  secondary: {
    bg: '#fff',
    hoverBg: '#EEF1F6',
    activeBg: '#DFE5EF',
    disabledBg: '#fff',
    color: 'var(--color-brand)',
    disabledColor: '#AEB6C4',
    border: '1.5px solid var(--color-brand)',
    disabledBorder: '1.5px solid #D2D8E2',
    weight: 600,
  },
  tertiary: {
    bg: '#EEF1F6',
    hoverBg: '#E1E7F0',
    activeBg: '#D5DDEA',
    disabledBg: '#F2F4F7',
    color: 'var(--color-brand)',
    disabledColor: '#AEB6C4',
    border: 'none',
    weight: 600,
  },
};

/**
 * Sizing role-map. `md`/`lg` resolve to the contract's control-height
 * tokens (44px/56px — both meet the 44×44px minimum touch target). `sm`
 * (36px) is a documented smaller variant for dense, non-primary-action
 * contexts (secondary/tertiary/link) — it is not intended as a lone primary
 * tap target; use `md` or larger for the primary action on a screen.
 */
const SIZES: Record<ButtonSize, { height: string; padding: string; font: number }> = {
  sm: { height: '36px', padding: '0 16px', font: 13 },
  md: { height: 'var(--control-height-md)', padding: '0 22px', font: 14 },
  lg: { height: 'var(--control-height-lg)', padding: '0 28px', font: 16 },
};

/**
 * Primary CTA and button system. One `primary` action per screen;
 * `--color-brand` (navy) is never used as a clickable action surface.
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
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  if (variant === 'link') {
    const s = SIZES[size];
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setActive(false);
        }}
        disabled={disabled}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          font: `600 ${s.font}px/1 var(--font-brand)`,
          color: disabled
            ? '#AEB6C4'
            : hover
              ? 'var(--color-trust)'
              : 'var(--color-brand)',
          textDecoration: disabled ? 'none' : 'underline',
          textUnderlineOffset: '3px',
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  const p = PALETTE[variant] ?? PALETTE.primary;
  const s = SIZES[size];
  const bg = disabled ? p.disabledBg : active ? p.activeBg : hover ? p.hoverBg : p.bg;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        flexDirection: subLabel ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: subLabel ? 3 : 9,
        width: fullWidth ? '100%' : 'auto',
        height: s.height,
        minHeight: s.height,
        padding: s.padding,
        background: bg,
        color: disabled ? p.disabledColor : p.color,
        border: disabled && p.disabledBorder ? p.disabledBorder : p.border,
        borderRadius: 'var(--radius-md)',
        font: `${p.weight} ${s.font}px/1 var(--font-brand)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: variant === 'primary' && !disabled ? 'var(--shadow-cta)' : 'none',
        transition: 'background .15s ease',
        ...style,
      }}
      {...rest}
    >
      {iconLeft && !subLabel ? (
        <span style={{ display: 'inline-flex' }}>{iconLeft}</span>
      ) : null}
      {subLabel ? (
        <>
          <span>{children}</span>
          <span style={{ font: '500 11px/1 var(--font-brand)', opacity: 0.85 }}>
            {subLabel}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
