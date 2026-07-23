'use client';

import React from 'react';

import { Link } from '@/i18n/navigation';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './MegaMenu.module.css';
import type { NavCategory } from './types';

export interface MegaMenuProps {
  /** Top-level categories (left rail). */
  categories: NavCategory[];
  /** Currently highlighted top-level category id (drives the middle column). */
  activeId: string;
  /** Called when the pointer/focus moves onto a left-rail category. */
  onActivate: (id: string) => void;
  /**
   * Sanitized CMS HTML for the promo + custom-links bar. Already run through
   * the server-side sanitizer; safe to inject. Empty string hides the bar.
   */
  promoHtml: string;
  /** Close the panel (e.g. after following a link). */
  onClose: () => void;
  /** Active UI locale — drives the store-locale chrome copy below. */
  locale?: SupportedLocale;
}

/**
 * Desktop mega-menu panel: a left rail of top-level categories, a middle column
 * of the active category's subtypes, and a right promo tile linking into the
 * active category — all driven by the live category tree. Beneath the columns
 * sits the dark custom-links bar, whose promo + links are authored in the CMS
 * and injected here after server-side sanitization. Only the active category's
 * content is shown; dismissal (mouse-leave, click-outside, Esc) is owned by the
 * header shell so only one panel is ever open.
 */
export function MegaMenu({
  categories,
  activeId,
  onActivate,
  promoHtml,
  onClose,
  locale = defaultLocale,
}: MegaMenuProps) {
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  if (!active) return null;

  const copy = getChromeCopy(locale);

  return (
    <div
      role="region"
      aria-label={copy.megaMenuRegionLabel(active.name)}
      className={styles.panel}
    >
      <div className={styles.cols}>
        {/* Left rail: every top-level category; hover/focus switches the panel. */}
        <ul className={styles.rail}>
          {categories.map((c) => {
            const isActive = c.id === active.id;
            const bridge = {
              '--local-fg': isActive ? 'var(--color-trust)' : 'var(--color-text-primary)',
              '--local-bg': isActive ? 'var(--color-trust-tint)' : 'transparent',
            } as React.CSSProperties;
            return (
              <li key={c.id}>
                <Link
                  href={`/${c.urlPath}`}
                  onMouseEnter={() => onActivate(c.id)}
                  onFocus={() => onActivate(c.id)}
                  onClick={onClose}
                  className={styles.railLink}
                  style={bridge}
                >
                  {c.name}
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Middle: the active category's subtypes. */}
        <div className={styles.middle}>
          <div className={styles.middleEyebrow}>{active.name}</div>
          {active.children.length > 0 ? (
            <ul className={styles.subtypeGrid}>
              {active.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/${child.urlPath}`}
                    onClick={onClose}
                    className={styles.subtypeLink}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>{copy.megaMenuEmptyState}</p>
          )}
        </div>

        {/* Right: live "shop all" promo tile for the active category. */}
        <div className={styles.promoCol}>
          <div aria-hidden="true" className={styles.promoTile} />
          <Link
            href={`/${active.urlPath}`}
            onClick={onClose}
            className={styles.promoLink}
          >
            {copy.megaMenuViewAllPrefix} {active.name}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Dark custom-links + promo bar, authored in the CMS and sanitized. */}
      {promoHtml ? (
        <div
          data-testid="mega-custom-links"
          className={styles.promoBar}
          dangerouslySetInnerHTML={{ __html: promoHtml }}
        />
      ) : null}
    </div>
  );
}
