import React from 'react';

import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './PriceBlock.module.css';

export interface PriceBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current price — number (formatted to €x,xx) or preformatted string. */
  price: number | string;
  /** Original price; when set, price turns urgency-toned and this shows struck through. */
  oldPrice?: number | string | null;
  /**
   * Font-size of the main price in px; the old-price size derives
   * proportionally (half of it). Left undefined by default so the default
   * render stays brand-overridable: the bridge then resolves to
   * `--type-stat-size` (34px) for the main price and `calc(... * 0.5)` for
   * the old price, so a brand can retheme the default price size. Only an
   * explicit caller override bakes a `${size}px` literal through the bridge
   * — the same default-to-a-token / px-on-override pattern the Rating and
   * IconButton `size` props follow.
   */
  size?: number;
  /** Show the "You save €x.xx" savings flag. */
  showSavings?: boolean;
  /** Override the auto-computed savings label. */
  savingsLabel?: string | null;
  /** e.g. "€107,07 / liter". */
  perUnit?: string | null;
  /** e.g. "Incl. btw, excl. verzendkosten". */
  note?: string | null;
  style?: React.CSSProperties;
}

/**
 * Local nl-NL / EUR formatter for V0.1.0. `PriceBlock` formats "€34,95"
 * (comma-decimal, "€" prefix) internally instead of pulling in an i18n
 * library. Kept isolated in this one function — not inlined — so it can later
 * be swapped for a centralized `Intl.NumberFormat('nl-NL', { style:
 * 'currency', currency: 'EUR' })`-based formatter without touching any call
 * site. Non-numeric (preformatted string) prices pass through unchanged.
 */
export function formatEuro(value: number | string): string {
  return typeof value === 'number' ? `€${value.toFixed(2).replace('.', ',')}` : value;
}

/**
 * Product price line. Handles sale styling, an auto-computed (or overridden)
 * savings flag, and a tax/per-unit note.
 *
 * No variant/tone role-map here: the only visual state is the boolean
 * `onSale` (derived from `oldPrice`), and both branches reference contract
 * tokens directly (`--color-brand-ink` / `--color-urgency` /
 * `--color-text-strikethrough` / `--color-urgency-chip`) — a two-state
 * boolean doesn't warrant a lookup table the way `Badge`/`Chip`'s
 * multi-variant role-maps do.
 */
export function PriceBlock({
  price,
  oldPrice = null,
  size,
  showSavings = false,
  savingsLabel = null,
  perUnit = null,
  note = null,
  style = {},
  ...rest
}: PriceBlockProps) {
  const onSale = oldPrice != null;
  const oldPriceLabel = oldPrice != null ? formatEuro(oldPrice) : null;
  const computedSavings =
    onSale && typeof price === 'number' && typeof oldPrice === 'number'
      ? getChromeCopy(defaultLocale).savingsLabel(formatEuro(oldPrice - price))
      : null;
  const savings = savingsLabel || computedSavings;

  const bridge = {
    '--local-price-size': size != null ? `${size}px` : 'var(--type-stat-size)',
    '--local-old-price-size':
      size != null ? `${Math.round(size * 0.5)}px` : 'calc(var(--type-stat-size) * 0.5)',
    '--local-price-fg': onSale ? 'var(--color-urgency)' : 'var(--color-brand-ink)',
  } as React.CSSProperties;

  return (
    <div style={style} {...rest}>
      <div className={styles.row} style={bridge}>
        <span className={styles.price}>{formatEuro(price)}</span>
        {onSale ? <span className={styles.oldPrice}>{oldPriceLabel}</span> : null}
        {showSavings && savings ? (
          <span className={styles.savings}>{savings}</span>
        ) : null}
      </div>
      {perUnit || note ? (
        <div className={styles.meta}>{[perUnit, note].filter(Boolean).join(' · ')}</div>
      ) : null}
    </div>
  );
}
