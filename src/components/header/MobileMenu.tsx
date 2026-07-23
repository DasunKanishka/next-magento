'use client';

import React from 'react';

import { Link } from '@/i18n/navigation';
import { languages } from '@/i18n/languages';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { languageDisplayName } from '@/i18n/display-names';
import codeChipStyles from '@/components/ui/core/codeChip.module.css';
import { useDismissMenu } from '@/components/ui/core/useDismissMenu';
import { DEALS_HREF, DEALS_LABEL } from './navConfig';
import styles from './MobileMenu.module.css';
import type { NavCategory } from './types';

export interface MobileMenuProps {
  categories: NavCategory[];
  /** Active UI language (drives the language list's checked state). */
  locale?: SupportedLocale;
  onLanguageChange?: (locale: SupportedLocale) => void;
}

/**
 * Mobile hamburger drawer. The trigger toggles a slide-in panel with the nav
 * list (Deals highlighted first) and a language list at the bottom. Categories
 * with subtypes drill down to a second level with a "‹ back" control, mirroring
 * the desktop mega-menu one level at a time. Closes on Esc, backdrop click, or
 * any navigation.
 */
export function MobileMenu({
  categories,
  locale = defaultLocale,
  onLanguageChange,
}: MobileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [drillId, setDrillId] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setDrillId(null);
  }, []);

  const { rootRef } = useDismissMenu(open, close, triggerRef);

  const drilled = drillId ? categories.find((c) => c.id === drillId) : null;
  const copy = getChromeCopy(locale);

  return (
    <div ref={rootRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? copy.mobileMenuToggleClose : copy.mobileMenuToggleOpen}
        onClick={() => (open ? close() : setOpen(true))}
        className={styles.trigger}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true" className={styles.bar} />
        ))}
      </button>

      {open ? (
        <>
          <div
            data-testid="mobile-menu-backdrop"
            onClick={close}
            className={styles.backdrop}
          />
          <nav aria-label={copy.mobileMenuLabel} className={styles.nav}>
            {drilled ? (
              <div>
                <button
                  type="button"
                  onClick={() => setDrillId(null)}
                  className={`${styles.drawerItem} ${styles.drawerItemBack}`}
                >
                  <span aria-hidden="true">‹</span> {copy.mobileMenuBack}
                </button>
                <Link
                  href={`/${drilled.urlPath}`}
                  onClick={close}
                  className={styles.drawerItem}
                >
                  {copy.mobileMenuViewAllPrefix(drilled.name)}
                </Link>
                {drilled.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/${child.urlPath}`}
                    onClick={close}
                    className={`${styles.drawerItem} ${styles.drawerItemChild}`}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div>
                <div className={`${styles.eyebrow} ${styles.menuEyebrow}`}>
                  {copy.mobileMenuSectionLabel}
                </div>
                <Link
                  href={DEALS_HREF}
                  onClick={close}
                  className={`${styles.drawerItem} ${styles.drawerItemDeals}`}
                >
                  {DEALS_LABEL}
                </Link>
                {categories.map((c) =>
                  c.children.length > 0 ? (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={copy.mobileMenuOpenSubmenu(c.name)}
                      onClick={() => setDrillId(c.id)}
                      className={styles.drawerItem}
                    >
                      {c.name}
                      <span aria-hidden="true">›</span>
                    </button>
                  ) : (
                    <Link
                      key={c.id}
                      href={`/${c.urlPath}`}
                      onClick={close}
                      className={styles.drawerItem}
                    >
                      {c.name}
                    </Link>
                  ),
                )}

                <div role="separator" className={styles.separator} />
                <div className={`${styles.eyebrow} ${styles.langEyebrow}`}>
                  {copy.mobileMenuLanguageLabel}
                </div>
                <ul
                  role="menu"
                  aria-label={copy.mobileMenuLanguageLabel}
                  className={styles.langList}
                >
                  {languages.map((l) => {
                    const active = l.locale === locale;
                    return (
                      <li key={l.code}>
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => {
                            onLanguageChange?.(l.locale);
                            close();
                          }}
                          className={`${styles.drawerItem} ${styles.langItem}`}
                        >
                          <span
                            className={`${codeChipStyles.codeChip} ${
                              active ? codeChipStyles.codeChipActive : ''
                            }`}
                          >
                            {l.code}
                          </span>
                          {languageDisplayName(locale, l.locale)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </nav>
        </>
      ) : null}
    </div>
  );
}
