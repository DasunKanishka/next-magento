'use client';

import React from 'react';

import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'style'
> {
  style?: React.CSSProperties;
}

/**
 * Standard single-line input. Rests on the `--color-border-field` hairline;
 * focus swaps to a `--color-brand` frame + `--focus-ring`. Height is
 * `--control-height-md` (44px — meets the minimum touch target).
 *
 * Styling follows the co-located CSS module (see src/components/STYLING.md):
 * the resting/focus frames and the placeholder color are static token
 * references, so this component sets no `--local-*` bridge property. A caller
 * may still pass `style` (held to the same `--local-*`-only rule) and
 * `className` for placement.
 */
export function TextField({
  placeholder = '',
  type = 'text',
  style = {},
  className,
  ...rest
}: TextFieldProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={className ? `${styles.field} ${className}` : styles.field}
      style={style}
      {...rest}
    />
  );
}
