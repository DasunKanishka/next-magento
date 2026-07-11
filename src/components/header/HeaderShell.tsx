'use client';

import React from 'react';

import { CountrySelector, SearchBar } from '@/components/ui';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { defaultCountryCode, findCountry, type CountryCode } from '@/i18n/countries';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { DELIVERY_DEADLINE_COPY, REVIEW_RATING_COPY } from '@/config/delivery';
import { STORE_IDENTITY } from '@/config/store-identity';
import { CartPill } from './CartPill';
import { DeliveryCountdown } from './DeliveryCountdown';
import { FreeShippingProgress } from './FreeShippingProgress';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { DEALS_HREF, DEALS_LABEL, MAX_INLINE_NAV_ITEMS } from './navConfig';
import type { NavCategory } from './types';

export interface HeaderShellProps {
  locale?: SupportedLocale;
  categories: NavCategory[];
  /** Sanitized CMS HTML for the mega-menu promo + custom-links bar. */
  megaPromoHtml?: string;
  /** Running cart item count (0 in this version — no cart mutation wired). */
  cartCount?: number;
  /** Running cart total in EUR. */
  cartTotal?: number;
}

// Responsive switch + sticky shadow. Kept as a scoped stylesheet (the same
// pattern the search bar uses for its pseudo-element rule) because inline styles
// cannot express media queries; the token-driven visuals stay inline so they
// remain assertable as real contract tokens.
const SCOPED_CSS = `
.hdr-mobile { display: none; }
@media (max-width: 900px) {
  .hdr-desktop { display: none; }
  .hdr-mobile { display: block; }
}
`;

const maxwRow: React.CSSProperties = {
  maxWidth: 'var(--layout-maxw)',
  margin: '0 auto',
  padding: '0 20px',
};

/**
 * Interactive header shell (conversion-focused variant). Sticky on scroll,
 * switches between a desktop layout and a mobile layout, and hosts the search
 * bar, the country/language selectors, the account entry point, the cart pill,
 * the free-shipping progress, the delivery-urgency countdown, the desktop
 * mega-menu, and the mobile drawer. Every control is a real button or link and
 * is reachable by keyboard alone.
 */
export function HeaderShell({
  locale = defaultLocale,
  categories,
  megaPromoHtml = '',
  cartCount = 0,
  cartTotal = 0,
}: HeaderShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [country, setCountry] = React.useState<CountryCode>(defaultCountryCode);
  const [megaActiveId, setMegaActiveId] = React.useState<string | null>(null);
  const navRef = React.useRef<HTMLDivElement>(null);

  const goTo = React.useCallback(
    (next: SupportedLocale) => {
      if (next !== locale) router.replace(pathname, { locale: next });
    },
    [router, pathname, locale],
  );

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMega = React.useCallback(() => setMegaActiveId(null), []);

  React.useEffect(() => {
    if (megaActiveId == null) return;
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) closeMega();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMega();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [megaActiveId, closeMega]);

  const inlineCats = categories.slice(0, MAX_INLINE_NAV_ITEMS);
  const overflowCats = categories.slice(MAX_INLINE_NAV_ITEMS);

  const navTriggerStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 'var(--tap-target-min)',
    padding: '0 12px',
    background: active ? 'var(--color-surface-inset-b)' : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    font: '600 14px/1 var(--font-brand)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
  });

  const dealsPill = (
    <Link
      href={DEALS_HREF}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 'var(--tap-target-min)',
        padding: '0 16px',
        background: 'var(--color-urgency)',
        color: '#fff',
        borderRadius: 'var(--radius-full)',
        font: '700 14px/1 var(--font-brand)',
        textDecoration: 'none',
      }}
    >
      {DEALS_LABEL}
    </Link>
  );

  const logo = (
    <Link
      href="/"
      aria-label={`${STORE_IDENTITY.name} — naar de homepagina`}
      style={{
        font: '800 22px/1 var(--font-brand)',
        color: 'var(--color-brand)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {STORE_IDENTITY.name}
    </Link>
  );

  const accountButton = (
    <button
      type="button"
      aria-label="Inloggen"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 'var(--tap-target-min)',
        minWidth: 'var(--tap-target-min)',
        padding: '0 14px',
        background: 'var(--color-surface)',
        border: 'var(--border-width-emphasis) solid var(--color-border-field)',
        borderRadius: 'var(--radius-md)',
        font: '600 14px/1 var(--font-brand)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
      }}
    >
      <span aria-hidden="true">👤</span>
      Inloggen
    </button>
  );

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--color-surface)',
        borderBottom: 'var(--border-width-default) solid var(--color-border-card)',
        boxShadow: scrolled ? 'var(--shadow-card)' : 'none',
        transition: 'box-shadow .15s ease',
      }}
    >
      <style>{SCOPED_CSS}</style>

      {/* ---------- Desktop ---------- */}
      <div className="hdr-desktop">
        <div
          style={{
            ...maxwRow,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 28,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 50 }}>
            {logo}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <SearchBar />
            <div
              style={{ display: 'flex', gap: 20, font: '500 12px/1 var(--font-brand)' }}
            >
              <span style={{ color: 'var(--color-cta)' }}>
                ✓ {DELIVERY_DEADLINE_COPY}
              </span>
              <span style={{ color: 'var(--color-premium-accent)' }}>
                ★ {REVIEW_RATING_COPY}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'stretch',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CountrySelector
                value={country}
                language={locale}
                onCountryChange={(code) => {
                  setCountry(code);
                  const next = findCountry(code)?.defaultLocale;
                  if (next) goTo(next);
                }}
                onLanguageChange={goTo}
              />
              {accountButton}
              <CartPill count={cartCount} total={cartTotal} />
            </div>
            <FreeShippingProgress cartTotal={cartTotal} />
          </div>
        </div>

        {/* Nav row 2 + mega-menu */}
        <div
          style={{
            borderTop: 'var(--border-width-default) solid var(--color-border-card)',
          }}
        >
          <div
            ref={navRef}
            onMouseLeave={closeMega}
            style={{ ...maxwRow, position: 'relative' }}
          >
            <nav
              aria-label="Hoofdnavigatie"
              style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 48 }}
            >
              {dealsPill}
              {inlineCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={megaActiveId === c.id}
                  onMouseEnter={() => setMegaActiveId(c.id)}
                  onFocus={() => setMegaActiveId(c.id)}
                  onClick={() => setMegaActiveId((cur) => (cur === c.id ? null : c.id))}
                  style={navTriggerStyle(megaActiveId === c.id)}
                >
                  {c.name}
                </button>
              ))}
              {overflowCats.length > 0 ? (
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={overflowCats.some((c) => c.id === megaActiveId)}
                  onMouseEnter={() => setMegaActiveId(overflowCats[0].id)}
                  onFocus={() => setMegaActiveId(overflowCats[0].id)}
                  onClick={() =>
                    setMegaActiveId((cur) =>
                      overflowCats.some((c) => c.id === cur) ? null : overflowCats[0].id,
                    )
                  }
                  style={navTriggerStyle(overflowCats.some((c) => c.id === megaActiveId))}
                >
                  meer ▾
                </button>
              ) : null}
              <span style={{ marginLeft: 'auto' }}>
                <DeliveryCountdown />
              </span>
            </nav>

            {megaActiveId != null ? (
              <MegaMenu
                categories={categories}
                activeId={megaActiveId}
                onActivate={setMegaActiveId}
                promoHtml={megaPromoHtml}
                onClose={closeMega}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* ---------- Mobile ---------- */}
      <div className="hdr-mobile">
        <div
          style={{
            background: 'var(--color-brand)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            padding: '5px 12px',
            font: '600 11px/1 var(--font-brand)',
          }}
        >
          <span>✓ {DELIVERY_DEADLINE_COPY}</span>
          <span style={{ color: 'var(--color-premium-accent)' }}>
            ★ {REVIEW_RATING_COPY}
          </span>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}
        >
          <MobileMenu categories={categories} locale={locale} onLanguageChange={goTo} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{logo}</div>
          <CountrySelector
            compact
            alignLeft
            value={country}
            language={locale}
            onCountryChange={(code) => {
              setCountry(code);
              const next = findCountry(code)?.defaultLocale;
              if (next) goTo(next);
            }}
            onLanguageChange={goTo}
          />
          <CartPill count={cartCount} total={cartTotal} />
        </div>

        <div style={{ padding: '0 12px 10px' }}>
          <SearchBar
            height={44}
            placeholder="Zoek merk, soort of product…"
            buttonLabel="⌕"
          />
        </div>
      </div>
    </header>
  );
}
