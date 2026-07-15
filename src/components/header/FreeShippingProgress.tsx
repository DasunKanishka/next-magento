'use client';

import React from 'react';

import {
  FREE_SHIPPING_THRESHOLD_EUR,
  freeShippingProgressPct,
  freeShippingRemaining,
} from '@/config/delivery';
import { formatEuro } from '@/components/ui';
import styles from './FreeShippingProgress.module.css';

export interface FreeShippingProgressProps {
  /** Running cart subtotal in EUR. Defaults to 0 (no cart mutation in this version). */
  cartTotal?: number;
  style?: React.CSSProperties;
}

/**
 * Free-shipping progress bar shown under the header utility cluster. Renders how
 * close the visitor is to the free-delivery threshold; at zero it invites them
 * toward it. The threshold is the single global value shared with the delivery
 * promise.
 */
export function FreeShippingProgress({
  cartTotal = 0,
  style = {},
}: FreeShippingProgressProps) {
  const pct = freeShippingProgressPct(cartTotal);
  const remaining = freeShippingRemaining(cartTotal);
  const reached = remaining <= 0;

  const message = reached
    ? 'Je hebt gratis bezorging'
    : `Nog ${formatEuro(remaining)} tot gratis bezorging`;

  const bridge = {
    '--local-message-fg': reached ? 'var(--color-cta)' : 'var(--color-text-muted)',
    '--local-fill-width': `${pct}%`,
  } as React.CSSProperties;

  return (
    <div className={styles.wrap} style={{ ...bridge, ...style }}>
      <div className={styles.message}>{message}</div>
      <div
        role="progressbar"
        aria-label={`Gratis bezorging vanaf ${formatEuro(FREE_SHIPPING_THRESHOLD_EUR)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={styles.track}
      >
        <div className={styles.fill} />
      </div>
    </div>
  );
}
