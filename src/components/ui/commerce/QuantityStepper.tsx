import React from 'react';

import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './QuantityStepper.module.css';

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
  /** Decrease/increase control aria-labels, resolved to the store locale. */
  decreaseLabel?: string;
  increaseLabel?: string;
  style?: React.CSSProperties;
}

/**
 * Per-size dimensions fed through the `--local-*` bridge (the closest analog
 * to Button's `SIZE_TOKENS`) — every value is a `var(--token)` reference, so
 * every size this control paints stays brand-overridable. `md`'s button
 * width is bumped from the source mock's 38px to 44px (`--tap-target-min`) so
 * the −/+ buttons meet the project's 44×44px minimum touch target; `lg`'s
 * 46px width already cleared the minimum, and also snaps to
 * `--tap-target-min` (+2px, within tolerance) rather than staying a raw
 * literal.
 *
 * Off-scale source values snapped within the 2px tolerance: `md.h` 46px →
 * `--control-height-md` (44px, -2px); `md.num` 34px → `--space-8` (32px,
 * -2px); `md.font`/`lg.font` (19px/22px) → `--icon-size-lg` (20px, +1px/-2px
 * — a text-size token would be semantically wrong for these ± icon glyphs,
 * per the icon-size family's own rationale in contract.ts); `lg.numFont` 17px
 * → `--type-body-size` (15px, -2px). Exact matches: `lg.h` 56px →
 * `--control-height-lg`; `md.numFont` 15px → `--type-body-size`. `lg.num`
 * (40px) sits 8px from the nearest spacing token (`--space-8`, 32px), well
 * past the snap tolerance, so it earns its own dedicated token,
 * `--stepper-num-w-lg`.
 */
const DIMS: Record<
  QuantityStepperSize,
  { h: string; w: string; num: string; font: string; numFont: string }
> = {
  md: {
    h: 'var(--control-height-md)',
    w: 'var(--tap-target-min)',
    num: 'var(--space-8)',
    font: 'var(--icon-size-lg)',
    numFont: 'var(--type-body-size)',
  },
  lg: {
    h: 'var(--control-height-lg)',
    w: 'var(--tap-target-min)',
    num: 'var(--stepper-num-w-lg)',
    font: 'var(--icon-size-lg)',
    numFont: 'var(--type-body-size)',
  },
};

/** – value + quantity control. Controlled via value/onChange; clamps to [min,max] (default 1–99). */
export function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  decreaseLabel = getChromeCopy(defaultLocale).quantityDecreaseLabel,
  increaseLabel = getChromeCopy(defaultLocale).quantityIncreaseLabel,
  style = {},
  ...rest
}: QuantityStepperProps) {
  const dims = DIMS[size] ?? DIMS.md;
  const set = (next: number) => onChange?.(Math.max(min, Math.min(max, next)));

  const bridge = {
    '--local-btn-w': dims.w,
    '--local-btn-h': dims.h,
    '--local-btn-font-size': dims.font,
    '--local-num-w': dims.num,
    '--local-num-font-size': dims.numFont,
  } as React.CSSProperties;

  return (
    <div className={styles.wrap} style={{ ...bridge, ...style }} {...rest}>
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={() => set(value - 1)}
        className={styles.button}
      >
        –
      </button>
      <div className={styles.num}>{value}</div>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => set(value + 1)}
        className={styles.button}
      >
        +
      </button>
    </div>
  );
}
