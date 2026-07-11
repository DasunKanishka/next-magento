'use client';

import React from 'react';

import { Link } from '@/i18n/navigation';
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
}: MegaMenuProps) {
  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  if (!active) return null;

  return (
    <div
      role="region"
      aria-label={`Categoriemenu: ${active.name}`}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'var(--color-surface)',
        border: 'var(--border-width-default) solid var(--color-border-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-overlay)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Left rail: every top-level category; hover/focus switches the panel. */}
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 12,
            minWidth: 220,
            borderRight: 'var(--border-width-default) solid var(--color-border-card)',
            background: 'var(--color-surface-inset-a)',
          }}
        >
          {categories.map((c) => {
            const isActive = c.id === active.id;
            return (
              <li key={c.id}>
                <Link
                  href={`/${c.urlPath}`}
                  onMouseEnter={() => onActivate(c.id)}
                  onFocus={() => onActivate(c.id)}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 'var(--tap-target-min)',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    font: '600 14px/1 var(--font-brand)',
                    color: isActive ? 'var(--color-trust)' : 'var(--color-text-primary)',
                    background: isActive ? 'var(--color-trust-tint)' : 'transparent',
                  }}
                >
                  {c.name}
                  <span aria-hidden="true">›</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Middle: the active category's subtypes. */}
        <div style={{ flex: 1, padding: 20, minWidth: 240 }}>
          <div
            style={{
              font: '600 11px/1 var(--font-brand)',
              letterSpacing: 'var(--type-eyebrow-tracking)',
              textTransform: 'uppercase',
              color: 'var(--color-text-subtle)',
              marginBottom: 12,
            }}
          >
            {active.name}
          </div>
          {active.children.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '2px 20px',
              }}
            >
              {active.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/${child.urlPath}`}
                    onClick={onClose}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 'var(--tap-target-min)',
                      font: '500 14px/1.3 var(--font-brand)',
                      color: 'var(--color-text-muted)',
                      textDecoration: 'none',
                    }}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                margin: 0,
                font: '500 14px/1.4 var(--font-brand)',
                color: 'var(--color-text-muted)',
              }}
            >
              Ontdek de volledige collectie.
            </p>
          )}
        </div>

        {/* Right: live "shop all" promo tile for the active category. */}
        <div
          style={{
            width: 260,
            padding: 20,
            borderLeft: 'var(--border-width-default) solid var(--color-border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              height: 120,
              borderRadius: 'var(--radius-md)',
              background: 'var(--pattern-photo-placeholder-b)',
            }}
          />
          <Link
            href={`/${active.urlPath}`}
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 'var(--tap-target-min)',
              font: '700 14px/1 var(--font-brand)',
              color: 'var(--color-trust)',
              textDecoration: 'none',
            }}
          >
            Bekijk alles in {active.name}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Dark custom-links + promo bar, authored in the CMS and sanitized. */}
      {promoHtml ? (
        <div
          data-testid="mega-custom-links"
          style={{
            background: 'var(--color-brand-ink)',
            color: '#fff',
            padding: '14px 20px',
            font: '500 13px/1.5 var(--font-brand)',
          }}
          dangerouslySetInnerHTML={{ __html: promoHtml }}
        />
      ) : null}
    </div>
  );
}
