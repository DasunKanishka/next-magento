import React from 'react';

export type QuantityStepperSize = 'md' | 'lg';

export interface QuantityStepperProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (next: number) => void;
  /** md (46px, sticky bars) or lg (56px, main buy box). */
  size?: QuantityStepperSize;
  style?: React.CSSProperties;
}

/**
 * Sizing role-map. `md`'s button width is bumped from the source mock's 38px
 * to 44px (matching `--tap-target-min`) so the −/+ buttons meet the
 * project's 44×44px minimum touch target; `lg`'s 46px width already cleared
 * the minimum, so it is unchanged.
 */
const DIMS: Record<
  QuantityStepperSize,
  { h: number; w: number; num: number; font: number; numFont: number }
> = {
  md: { h: 46, w: 44, num: 34, font: 19, numFont: 15 },
  lg: { h: 56, w: 46, num: 40, font: 22, numFont: 17 },
};

/** – value + quantity control. Controlled via value/onChange; clamps to [min,max] (default 1–99). */
export function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  style = {},
  ...rest
}: QuantityStepperProps) {
  const dims = DIMS[size] ?? DIMS.md;
  const set = (next: number) => onChange?.(Math.max(min, Math.min(max, next)));

  const buttonStyle: React.CSSProperties = {
    width: dims.w,
    height: dims.h,
    minWidth: dims.w,
    minHeight: dims.h,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: dims.font,
    color: 'var(--color-brand)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    padding: 0,
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1.5px solid var(--color-border-field)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        flex: '0 0 auto',
        ...style,
      }}
      {...rest}
    >
      <button
        type="button"
        aria-label="Aantal verlagen"
        onClick={() => set(value - 1)}
        style={buttonStyle}
      >
        –
      </button>
      <div
        style={{
          width: dims.num,
          textAlign: 'center',
          font: `600 ${dims.numFont}px/1 var(--font-brand)`,
        }}
      >
        {value}
      </div>
      <button
        type="button"
        aria-label="Aantal verhogen"
        onClick={() => set(value + 1)}
        style={buttonStyle}
      >
        +
      </button>
    </div>
  );
}
