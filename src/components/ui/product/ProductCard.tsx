import React from 'react';

import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { Badge } from '../core/Badge';
import { IconButton } from '../core/IconButton';
import { Rating } from '../core/Rating';
import { formatEuro } from './PriceBlock';
import styles from './ProductCard.module.css';

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
  /**
   * Add-to-cart control aria-label, resolved to the store locale. Defaults to
   * the store-scope-resolved default locale's catalog entry — callers that
   * thread a request-resolved locale down may override.
   */
  addToCartLabel?: string;
  /**
   * Wishlist control aria-label, resolved to the store locale. Same
   * default/override contract as `addToCartLabel`.
   */
  wishlistLabel?: string;
  style?: React.CSSProperties;
}

/**
 * Grid product card — the repeating unit in listings & cross-sell.
 *
 * Composes `Badge` (sale flag, top-left) and `Rating` (review stars) rather
 * than reimplementing either. The wishlist heart and add-to-cart affordances
 * reuse `IconButton` so both meet the 44×44px minimum touch target by
 * default — the source mock's 32px wishlist / 40px add-button sizes fell
 * short of that minimum. The wishlist glyph now takes IconButton's own
 * default glyph size (`--icon-size-md`, 16px — a 14px→16px snap); the
 * add-to-cart glyph overrides it to `--icon-size-lg` (20px, a 19px→20px
 * snap) via the consumer-facing `--local-*` style bridge.
 */
export function ProductCard({
  brand,
  name,
  price,
  oldPrice = null,
  reviews = null,
  saleBadge = null,
  onAdd,
  addToCartLabel = getChromeCopy(defaultLocale).addToCartLabel,
  wishlistLabel = getChromeCopy(defaultLocale).wishlistLabel,
  wishlist = true,
  style = {},
  className,
  ...rest
}: ProductCardProps) {
  const onSale = oldPrice != null;
  const oldPriceLabel = oldPrice != null ? formatEuro(oldPrice) : null;

  const priceBridge = {
    '--local-price-fg': onSale ? 'var(--color-urgency)' : 'var(--color-brand-ink)',
  } as React.CSSProperties;

  return (
    <div
      className={[styles.card, className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    >
      {saleBadge ? (
        <span className={styles.saleBadgeSlot}>
          <Badge variant="sale">{saleBadge}</Badge>
        </span>
      ) : null}
      {wishlist ? (
        <span className={styles.wishlistSlot}>
          <IconButton aria-label={wishlistLabel} color="var(--color-urgency)">
            ♡
          </IconButton>
        </span>
      ) : null}
      <div className={styles.media}>
        {getChromeCopy(defaultLocale).productPhotoPlaceholder}
      </div>
      {brand ? <div className={styles.brand}>{brand}</div> : null}
      <div className={styles.name}>{name}</div>
      {reviews != null ? (
        <div className={styles.ratingWrap}>
          <Rating value={5} count={reviews} size={11} />
        </div>
      ) : null}
      <div className={styles.priceRow}>
        <div className={styles.priceGroup}>
          <span className={styles.price} style={priceBridge}>
            {formatEuro(price)}
          </span>
          {onSale ? <span className={styles.oldPrice}>{oldPriceLabel}</span> : null}
        </div>
        <IconButton
          onClick={onAdd}
          bordered={false}
          color="var(--color-text-on-fill)"
          aria-label={addToCartLabel}
          style={
            {
              '--local-bg': 'var(--color-cta)',
              '--local-font-size': 'var(--icon-size-lg)',
            } as React.CSSProperties
          }
        >
          +
        </IconButton>
      </div>
    </div>
  );
}
