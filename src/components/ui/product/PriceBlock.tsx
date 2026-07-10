import React from 'react';

export interface PriceBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current price — number (formatted to €x,xx) or preformatted string. */
  price: number | string;
  /** Original price; when set, price turns urgency-toned and this shows struck through. */
  oldPrice?: number | string | null;
  /** Font-size of the main price in px. */
  size?: number;
  /** Show the "Je bespaart €x,xx" savings flag. */
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
 * Local nl-NL / EUR formatter for V0.1.0. Issue 006 does not depend on issue
 * 007 (next-intl), so `PriceBlock` formats "€34,95" (comma-decimal, "€"
 * prefix) internally instead of pulling in an i18n library. Kept isolated in
 * this one function — not inlined — so issue 007 can later swap it for a
 * centralized `Intl.NumberFormat('nl-NL', { style: 'currency', currency:
 * 'EUR' })`-based formatter without touching any call site. Non-numeric
 * (preformatted string) prices pass through unchanged.
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
  size = 34,
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
      ? `Je bespaart ${formatEuro(oldPrice - price)}`
      : null;
  const savings = savingsLabel || computedSavings;

  return (
    <div style={style} {...rest}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span
          style={{
            font: `700 ${size}px/1 var(--font-brand)`,
            color: onSale ? 'var(--color-urgency)' : 'var(--color-brand-ink)',
          }}
        >
          {formatEuro(price)}
        </span>
        {onSale ? (
          <span
            style={{
              font: `500 ${Math.round(size * 0.5)}px/1 var(--font-brand)`,
              color: 'var(--color-text-strikethrough)',
              textDecoration: 'line-through',
              paddingBottom: 3,
            }}
          >
            {oldPriceLabel}
          </span>
        ) : null}
        {showSavings && savings ? (
          <span
            style={{
              background: 'var(--color-urgency-chip)',
              color: 'var(--color-urgency)',
              font: '600 13px/1 var(--font-brand)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 1,
            }}
          >
            {savings}
          </span>
        ) : null}
      </div>
      {perUnit || note ? (
        <div
          style={{
            marginTop: 7,
            font: '500 12px/1 var(--font-brand)',
            color: 'var(--color-text-subtle)',
          }}
        >
          {[perUnit, note].filter(Boolean).join(' · ')}
        </div>
      ) : null}
    </div>
  );
}
