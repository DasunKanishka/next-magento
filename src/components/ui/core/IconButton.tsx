'use client';

import React from 'react';

export type IconButtonShape = 'circle' | 'rounded';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  shape?: IconButtonShape;
  /**
   * Control size in px. Defaults to the contract's `--tap-target-min` (44px)
   * — the source design mock documented a 40px default ("min touch-friendly"),
   * which falls short of the project's 44×44px minimum touch target
   * requirement, so the default was raised to the token value. The prop is
   * fully overridable (same interface/type as documented), so call sites
   * that intentionally need a smaller glyph can still pass a smaller number.
   */
  size?: number;
  /** Glyph colour override — e.g. `--color-urgency` for a wishlist heart. */
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
  const dimension = size != null ? `${size}px` : DEFAULT_SIZE_TOKEN;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        color,
        border: bordered ? '1.5px solid var(--color-border-field)' : 'none',
        borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
        cursor: 'pointer',
        userSelect: 'none',
        padding: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
