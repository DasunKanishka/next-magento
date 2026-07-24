'use client';

import React from 'react';

import { formatEuro } from '@/components/ui';
import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './CartPill.module.css';

export interface CartPillProps {
  /** Running item count. Shown as a red count badge when above zero. */
  count?: number;
  /** Running cart total in EUR. */
  total?: number;
  onClick?: () => void;
  /** aria-label builder, resolved to the store locale by default. */
  ariaLabel?: (count: number, total: string) => string;
  style?: React.CSSProperties;
}

/**
 * Header cart control — a real button showing the running item count (red
 * badge) and the running total. No cart mutation is wired behind it in this
 * version; it exposes the affordance and forwards the click. Meets the minimum
 * tap target.
 */
export function CartPill({
  count = 0,
  total = 0,
  onClick,
  ariaLabel = getChromeCopy(defaultLocale).cartAriaLabel,
  style = {},
}: CartPillProps) {
  const hasItems = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel(count, formatEuro(total))}
      className={styles.pill}
      style={style}
    >
      <span aria-hidden="true" className={styles.icon}>
        🛒
      </span>
      <span>{formatEuro(total)}</span>
      {hasItems ? (
        <span aria-hidden="true" className={styles.badge}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
