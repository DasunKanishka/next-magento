import React from 'react';

import { Badge } from '../core/Badge';
import { IconButton } from '../core/IconButton';
import { Rating } from '../core/Rating';
import { formatEuro } from './PriceBlock';

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase trust-toned brand/category eyebrow. */
  brand?: string;
  name: string;
  price: number | string;
  oldPrice?: number | string | null;
  /**
   * Review count. Per the design spec this always renders a full 5-star
   * glyph row (only the count varies) — preserved exactly as documented,
   * not a bug.
   */
  reviews?: number | null;
  /** Sale flag text, e.g. "−17%". Rendered via the shared `Badge` — not reimplemented here. */
  saleBadge?: string | null;
  wishlist?: boolean;
  /**
   * Card-level add-to-cart callback. Performs NO cart mutation itself —
   * mutation is deferred to a later version (V0.3.0+); this component only
   * exposes the affordance and forwards the click.
   */
  onAdd?: () => void;
  style?: React.CSSProperties;
}

/**
 * The "PRODUCTFOTO" placeholder-slot label tint. The source design spec does
 * not map this one-off text color to any contract token (its nearest
 * neighbors are visibly different shades), so it stays literal here — same
 * documented-exception pattern as `Chip`'s `spec` variant border.
 */
const PLACEHOLDER_LABEL_COLOR = '#B0926A';

/**
 * Grid product card — the repeating unit in listings & cross-sell.
 *
 * Composes `Badge` (sale flag, top-left) and `Rating` (review stars) rather
 * than reimplementing either. The wishlist heart and add-to-cart affordances
 * reuse `IconButton` so both meet the 44×44px minimum touch target by
 * default — the source mock's 32px wishlist / 40px add-button sizes fell
 * short of that minimum.
 */
export function ProductCard({
  brand,
  name,
  price,
  oldPrice = null,
  reviews = null,
  saleBadge = null,
  onAdd,
  wishlist = true,
  style = {},
  ...rest
}: ProductCardProps) {
  const onSale = oldPrice != null;
  const oldPriceLabel = oldPrice != null ? formatEuro(oldPrice) : null;

  return (
    <div
      style={{
        border: '1px solid var(--color-border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...style,
      }}
      {...rest}
    >
      {saleBadge ? (
        <span style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
          <Badge variant="sale">{saleBadge}</Badge>
        </span>
      ) : null}
      {wishlist ? (
        <span style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
          <IconButton
            aria-label="Voeg toe aan verlanglijst"
            color="var(--color-urgency)"
            style={{ fontSize: 14 }}
          >
            ♡
          </IconButton>
        </span>
      ) : null}
      <div
        style={{
          height: 180,
          borderRadius: 8,
          background: 'var(--pattern-photo-placeholder-a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '600 9px/1 var(--font-brand)',
          color: PLACEHOLDER_LABEL_COLOR,
        }}
      >
        PRODUCTFOTO
      </div>
      {brand ? (
        <div
          style={{
            font: '500 11px/1 var(--font-brand)',
            color: 'var(--color-trust)',
            marginTop: 13,
            letterSpacing: 'var(--type-tag-tracking)',
            textTransform: 'uppercase',
          }}
        >
          {brand}
        </div>
      ) : null}
      <div
        style={{
          font: '500 14px/1.3 var(--font-brand)',
          marginTop: 5,
          color: 'var(--color-brand-ink)',
          flex: 1,
        }}
      >
        {name}
      </div>
      {reviews != null ? (
        <div style={{ marginTop: 8 }}>
          <Rating value={5} count={reviews} size={11} />
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span
            style={{
              font: '700 18px/1 var(--font-brand)',
              color: onSale ? 'var(--color-urgency)' : 'var(--color-brand-ink)',
            }}
          >
            {formatEuro(price)}
          </span>
          {onSale ? (
            <span
              style={{
                font: '500 12px/1 var(--font-brand)',
                color: 'var(--color-text-strikethrough)',
                textDecoration: 'line-through',
              }}
            >
              {oldPriceLabel}
            </span>
          ) : null}
        </div>
        <IconButton
          onClick={onAdd}
          bordered={false}
          color="#fff"
          aria-label="Toevoegen aan winkelmandje"
          style={{ background: 'var(--color-cta)', fontSize: 19 }}
        >
          +
        </IconButton>
      </div>
    </div>
  );
}
