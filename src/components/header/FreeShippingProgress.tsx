'use client';

import React from 'react';

import {
  FREE_SHIPPING_THRESHOLD_EUR,
  freeShippingProgressPct,
  freeShippingRemaining,
} from '@/config/delivery';
import { formatEuro } from '@/components/ui';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <div
        style={{
          font: '600 11px/1 var(--font-brand)',
          color: reached ? 'var(--color-cta)' : 'var(--color-text-muted)',
        }}
      >
        {message}
      </div>
      <div
        role="progressbar"
        aria-label={`Gratis bezorging vanaf ${formatEuro(FREE_SHIPPING_THRESHOLD_EUR)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface-inset-b)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--color-cta)',
            borderRadius: 'var(--radius-full)',
            transition: 'width .25s ease',
          }}
        />
      </div>
    </div>
  );
}
