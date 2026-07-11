'use client';

import React from 'react';

import { formatEuro } from '@/components/ui';

export interface CartPillProps {
  /** Running item count. Shown as a red count badge when above zero. */
  count?: number;
  /** Running cart total in EUR. */
  total?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Header cart control — a real button showing the running item count (red
 * badge) and the running total. No cart mutation is wired behind it in this
 * version; it exposes the affordance and forwards the click. Meets the minimum
 * tap target.
 */
export function CartPill({ count = 0, total = 0, onClick, style = {} }: CartPillProps) {
  const hasItems = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Winkelmandje: ${count} artikelen, totaal ${formatEuro(total)}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 'var(--tap-target-min)',
        minWidth: 'var(--tap-target-min)',
        padding: '0 16px',
        background: 'var(--color-brand)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        font: '600 14px/1 var(--font-brand)',
        cursor: 'pointer',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16 }}>
        🛒
      </span>
      <span>{formatEuro(total)}</span>
      {hasItems ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 20,
            height: 20,
            padding: '0 5px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-urgency)',
            color: '#fff',
            borderRadius: 'var(--radius-full)',
            font: '700 11px/1 var(--font-brand)',
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
