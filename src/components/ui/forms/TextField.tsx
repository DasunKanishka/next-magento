'use client';

import React from 'react';

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  style?: React.CSSProperties;
}

/**
 * Standard single-line input. Rests on the `--color-border-field` hairline;
 * focus swaps to a 2px `--color-brand` frame + `--focus-ring`. Height is
 * `--control-height-md` (44px — meets the minimum touch target).
 */
export function TextField({
  placeholder = '',
  value,
  onChange,
  type = 'text',
  style = {},
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const reactId = React.useId();
  const inputSelector = `textfield-input-${reactId}`;
  const [focus, setFocus] = React.useState(false);

  return (
    <>
      <style>{`[data-textfield-input="${inputSelector}"]::placeholder { color: var(--color-text-placeholder); }`}</style>
      <input
        type={type}
        value={value}
        onChange={onChange}
        data-textfield-input={inputSelector}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        placeholder={placeholder}
        style={{
          height: 'var(--control-height-md)',
          minHeight: 'var(--control-height-md)',
          width: '100%',
          border: focus ? '2px solid var(--color-brand)' : '1.5px solid var(--color-border-field)',
          borderRadius: 'var(--radius-md)',
          padding: '0 14px',
          font: '400 13px/1 var(--font-brand)',
          color: 'var(--color-brand)',
          outline: 'none',
          background: '#fff',
          boxShadow: focus ? 'var(--focus-ring)' : 'none',
          transition: 'box-shadow .15s ease',
          ...style,
        }}
        {...rest}
      />
    </>
  );
}
