'use client';

import React from 'react';

import styles from './IconButton.module.css';

export type IconButtonShape = 'circle' | 'rounded';

export interface IconButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'color'
> {
  shape?: IconButtonShape;
  /**
   * Control size in px. Defaults to the contract's `--tap-target-min` (44px)
   * — the source design mock documented a 40px default ("min touch-friendly"),
   * which falls short of the project's 44×44px minimum touch target
   * requirement, so the default was raised to the token value. The prop is
   * fully overridable (same interface/type as documented), so call sites
   * that intentionally need a smaller glyph can still pass a smaller number
   * — an explicit override is a caller-supplied dynamic value, not a baked
   * brand literal, so it bridges as a plain computed px value (mirroring the
   * FreeShippingProgress `--local-fill-width` / Carousel `--local-item-min-w`
   * precedent) rather than a token.
   */
  size?: number;
  /** Glyph colour — a token reference, e.g. `var(--color-urgency)` for a wishlist heart. */
  color?: string;
  bordered?: boolean;
}

const DEFAULT_SIZE_TOKEN = 'var(--tap-target-min)';

/** Circular/rounded icon-only button — wishlist heart, quantity ± steppers. */
export function IconButton({
  shape = 'circle',
  size,
  color = 'var(--color-brand)',
  bordered = true,
  onClick,
  children,
  style = {},
  ...rest
}: IconButtonProps) {
  const bridge = {
    '--local-size': size != null ? `${size}px` : DEFAULT_SIZE_TOKEN,
    // Default glyph size: --icon-size-md (16px). ProductCard's add-to-cart
    // button overrides this to --icon-size-lg via the consumer style bridge.
    '--local-font-size': 'var(--icon-size-md)',
    '--local-bg': 'var(--color-surface)',
    '--local-fg': color,
    '--local-border': bordered
      ? 'var(--border-width-emphasis) solid var(--color-border-field)'
      : 'none',
  } as React.CSSProperties;

  return (
    <button
      type="button"
      className={styles.iconButton}
      data-shape={shape}
      onClick={onClick}
      style={{ ...bridge, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
