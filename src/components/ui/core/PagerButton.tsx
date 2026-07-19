'use client';

import React from 'react';

import { IconButton } from './IconButton';
import styles from './PagerButton.module.css';

export type PagerButtonVariant = 'on-surface' | 'on-brand';
export type PagerButtonDirection = 'prev' | 'next';

export interface PagerButtonProps {
  /**
   * `on-surface` — bordered card-surface fill (the Carousel arrow).
   * `on-brand` — borderless brand-surface fill (the HeroSlider arrow).
   */
  variant: PagerButtonVariant;
  /** Which side of the paged region this button advances toward. */
  direction: PagerButtonDirection;
  /** Accessible label — copy varies per call site (e.g. "Vorige" vs "Vorige campagne"). */
  label: string;
  onClick: () => void;
}

const GLYPH: Record<PagerButtonDirection, string> = { prev: '‹', next: '›' };

/**
 * Round prev/next paging arrow — the primitive extracted from the
 * near-identical Carousel/HeroSlider `.arrow` rules. Composes `IconButton`
 * for the round shell (size, circle radius, cursor, focus behaviour) and
 * adds only what IconButton doesn't provide: the on-surface card shadow and
 * placement (desktop-gating + prev/next offset), both variant/direction
 * mechanics rather than themeable values (see PagerButton.module.css).
 *
 * The border is the single source of truth via the `--local-border` bridge:
 * on-surface uses `--border-width-default` / `--color-border-card` (which
 * differ from IconButton's own bordered default of `--border-width-emphasis` /
 * `--color-border-field`, so it must be an explicit bridge override anyway),
 * on-brand is borderless. Because IconButton spreads the consumer `style`
 * last, this bridge always wins over IconButton's `bordered` prop, so that
 * prop is left at its default and the border lives entirely in the bridge.
 */
export function PagerButton({ variant, direction, label, onClick }: PagerButtonProps) {
  const bridge = {
    '--local-bg':
      variant === 'on-brand' ? 'var(--color-surface-on-brand)' : 'var(--color-surface)',
    '--local-fg':
      variant === 'on-brand' ? 'var(--color-text-on-fill)' : 'var(--color-text-primary)',
    '--local-font-size':
      variant === 'on-brand' ? 'var(--type-h3-size)' : 'var(--type-price-size)',
    '--local-border':
      variant === 'on-brand'
        ? 'none'
        : 'var(--border-width-default) solid var(--color-border-card)',
  } as React.CSSProperties;

  const variantClass = variant === 'on-brand' ? styles.onBrand : styles.onSurface;
  const directionClass = direction === 'prev' ? styles.prev : styles.next;

  return (
    <IconButton
      aria-label={label}
      onClick={onClick}
      className={`${styles.pagerButton} ${variantClass} ${directionClass}`}
      style={bridge}
    >
      {GLYPH[direction]}
    </IconButton>
  );
}
