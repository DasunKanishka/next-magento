'use client';

import React from 'react';

import { Link } from '@/i18n/navigation';
import { languages } from '@/i18n/languages';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { codeChipStyle } from '@/components/ui/i18n/selectorShared';
import { DEALS_HREF, DEALS_LABEL } from './navConfig';
import type { NavCategory } from './types';

export interface MobileMenuProps {
  categories: NavCategory[];
  /** Active UI language (drives the language list's checked state). */
  locale?: SupportedLocale;
  onLanguageChange?: (locale: SupportedLocale) => void;
}

const drawerItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  minHeight: 'var(--tap-target-min)',
  padding: '0 14px',
  border: 'none',
  background: 'transparent',
  borderRadius: 'var(--radius-sm)',
  font: '600 15px/1 var(--font-brand)',
  color: 'var(--color-text-primary)',
  textDecoration: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

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
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
        onClick={() => (open ? close() : setOpen(true))}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
          minWidth: 'var(--tap-target-min)',
          minHeight: 'var(--tap-target-min)',
          padding: 10,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: 'block',
              width: 22,
              height: 2,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-brand)',
            }}
          />
        ))}
      </button>

      {open ? (
        <>
          <div
            data-testid="mobile-menu-backdrop"
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 70,
              background: 'rgba(4,12,28,.45)',
            }}
          />
          <nav
            aria-label="Hoofdmenu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 80,
              width: 262,
              maxWidth: '90vw',
              background: 'var(--color-surface)',
              border: 'var(--border-width-default) solid var(--color-border-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-overlay)',
              padding: 10,
            }}
          >
            {drilled ? (
              <div>
                <button
                  type="button"
                  onClick={() => setDrillId(null)}
                  style={{
                    ...drawerItemStyle,
                    justifyContent: 'flex-start',
                    gap: 8,
                    color: 'var(--color-trust)',
                    font: '600 13px/1 var(--font-brand)',
                  }}
                >
                  <span aria-hidden="true">‹</span> terug
                </button>
                <Link
                  href={`/${drilled.urlPath}`}
                  onClick={close}
                  style={drawerItemStyle}
                >
                  Alles in {drilled.name}
                </Link>
                {drilled.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/${child.urlPath}`}
                    onClick={close}
                    style={{
                      ...drawerItemStyle,
                      font: '500 14px/1 var(--font-brand)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    font: '600 11px/1 var(--font-brand)',
                    letterSpacing: 'var(--type-eyebrow-tracking)',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-subtle)',
                    padding: '6px 14px 8px',
                  }}
                >
                  Menu
                </div>
                <Link
                  href={DEALS_HREF}
                  onClick={close}
                  style={{ ...drawerItemStyle, color: 'var(--color-urgency)' }}
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
                      style={drawerItemStyle}
                    >
                      {c.name}
                      <span aria-hidden="true">›</span>
                    </button>
                  ) : (
                    <Link
                      key={c.id}
                      href={`/${c.urlPath}`}
                      onClick={close}
                      style={drawerItemStyle}
                    >
                      {c.name}
                    </Link>
                  ),
                )}

                <div
                  role="separator"
                  style={{
                    height: 'var(--border-width-default)',
                    background: 'var(--color-border-card)',
                    margin: '10px 6px',
                  }}
                />
                <div
                  style={{
                    font: '600 11px/1 var(--font-brand)',
                    letterSpacing: 'var(--type-eyebrow-tracking)',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-subtle)',
                    padding: '2px 14px 8px',
                  }}
                >
                  Taal
                </div>
                <ul
                  role="menu"
                  aria-label="Taal"
                  style={{ listStyle: 'none', margin: 0, padding: 0 }}
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
                          style={{
                            ...drawerItemStyle,
                            justifyContent: 'flex-start',
                            gap: 10,
                            font: '500 14px/1 var(--font-brand)',
                          }}
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
