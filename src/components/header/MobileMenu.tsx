'use client';

import React from 'react';

import { Link } from '@/i18n/navigation';
import { languages } from '@/i18n/languages';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { codeChipStyle } from '@/components/ui/i18n/selectorShared';
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
 * with subtypes drill down to a second level with a "‹ terug" control, mirroring
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

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const drilled = drillId ? categories.find((c) => c.id === drillId) : null;

  return (
    <div className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
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
          <nav aria-label="Hoofdmenu" className={styles.nav}>
            {drilled ? (
              <div>
                <button
                  type="button"
                  onClick={() => setDrillId(null)}
                  className={`${styles.drawerItem} ${styles.drawerItemBack}`}
                >
                  <span aria-hidden="true">‹</span> terug
                </button>
                <Link
                  href={`/${drilled.urlPath}`}
                  onClick={close}
                  className={styles.drawerItem}
                >
                  Alles in {drilled.name}
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
                <div className={`${styles.eyebrow} ${styles.menuEyebrow}`}>Menu</div>
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
                      aria-label={`${c.name} — submenu openen`}
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
                <div className={`${styles.eyebrow} ${styles.langEyebrow}`}>Taal</div>
                <ul role="menu" aria-label="Taal" className={styles.langList}>
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
                          <span style={codeChipStyle(active)}>{l.code}</span>
                          {l.name}
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
