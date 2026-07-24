'use client';

import React from 'react';

import { CountrySelector, SearchBar } from '@/components/ui';
import { Logo } from '@/components/ui/core/Logo';
import { useDismissMenu } from '@/components/ui/core/useDismissMenu';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { defaultCountryCode, findCountry, type CountryCode } from '@/i18n/countries';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { REVIEW_RATING_COPY } from '@/config/delivery';
import type { StoreIdentityDeliveryPromise, StoreIdentityLogo } from '@/lib/data-source';
import { CartPill } from './CartPill';
import { DeliveryCountdown } from './DeliveryCountdown';
import { FreeShippingProgress } from './FreeShippingProgress';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { DEALS_HREF, DEALS_LABEL, MAX_INLINE_NAV_ITEMS } from './navConfig';
import styles from './HeaderShell.module.css';
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
  /** Backend-sourced logo (`identity.logo`) — image-with-text-fallback wordmark + its aria-label. */
  logo: StoreIdentityLogo;
  /** Backend-sourced delivery promise (`identity.deliveryPromise`) — the trust-row copy + the countdown's cut-off hour. */
  deliveryPromise: StoreIdentityDeliveryPromise;
}

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
  logo,
  deliveryPromise,
}: HeaderShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Store-locale chrome copy — resolved from the `locale` prop, itself
  // resolved from `storeConfig` at the server boundary (see `Header`'s
  // caller). Never hardcode UI-chrome text in this component.
  const copy = getChromeCopy(locale);
  const [scrolled, setScrolled] = React.useState(false);
  const [country, setCountry] = React.useState<CountryCode>(defaultCountryCode);
  const [megaActiveId, setMegaActiveId] = React.useState<string | null>(null);

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
  const { rootRef: navRef } = useDismissMenu(megaActiveId != null, closeMega);

  const inlineCats = categories.slice(0, MAX_INLINE_NAV_ITEMS);
  const overflowCats = categories.slice(MAX_INLINE_NAV_ITEMS);

  const navTriggerBridge = (active: boolean): React.CSSProperties =>
    ({
      '--local-nav-bg': active ? 'var(--color-surface-inset-b)' : 'transparent',
    }) as React.CSSProperties;

  const dealsPill = (
    <Link href={DEALS_HREF} className={styles.dealsPill}>
      {DEALS_LABEL}
    </Link>
  );

  const logoEl = <Logo logo={logo} className={styles.logo} />;

  const accountButton = (
    <button type="button" aria-label={copy.accountLabel} className={styles.accountButton}>
      <span aria-hidden="true">👤</span>
      {copy.accountLabel}
    </button>
  );

  const headerBridge = {
    '--local-shadow': scrolled ? 'var(--shadow-card)' : 'none',
  } as React.CSSProperties;

  return (
    <header className={styles.header} style={headerBridge}>
      {/* ---------- Desktop ---------- */}
      <div className={styles.desktop}>
        <div className={`${styles.maxwRow} ${styles.topRow}`}>
          <div className={styles.logoWrap}>{logoEl}</div>

          <div className={styles.searchCol}>
            <SearchBar
              placeholder={copy.searchPlaceholder}
              searchLabel={copy.searchLabel}
              emptyQueryMessage={copy.searchEmptyQueryMessage}
            />
            <div className={styles.trustRow}>
              <span className={styles.trustDelivery}>✓ {deliveryPromise.copy}</span>
              <span className={styles.trustRating}>★ {REVIEW_RATING_COPY}</span>
            </div>
          </div>

          <div className={styles.utilCol}>
            <div className={styles.utilRow}>
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
        <div className={styles.navSection}>
          <div
            ref={navRef}
            onMouseLeave={closeMega}
            className={`${styles.maxwRow} ${styles.navRowOuter}`}
          >
            <nav aria-label={copy.mainNavLabel} className={styles.navBar}>
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
                  className={styles.navTrigger}
                  style={navTriggerBridge(megaActiveId === c.id)}
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
                  className={styles.navTrigger}
                  style={navTriggerBridge(
                    overflowCats.some((c) => c.id === megaActiveId),
                  )}
                >
                  {copy.moreLabel}
                </button>
              ) : null}
              <span className={styles.countdownSlot}>
                <DeliveryCountdown
                  copy={deliveryPromise.copy}
                  cutoffHour={deliveryPromise.cutoffHour}
                  locale={locale}
                />
              </span>
            </nav>

            {megaActiveId != null ? (
              <MegaMenu
                categories={categories}
                activeId={megaActiveId}
                onActivate={setMegaActiveId}
                promoHtml={megaPromoHtml}
                onClose={closeMega}
                locale={locale}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* ---------- Mobile ---------- */}
      <div className={styles.mobile}>
        <div className={styles.mobileTrustBar}>
          <span>✓ {deliveryPromise.copy}</span>
          <span className={styles.mobileTrustRating}>★ {REVIEW_RATING_COPY}</span>
        </div>

        <div className={styles.mobileTopRow}>
          <MobileMenu categories={categories} locale={locale} onLanguageChange={goTo} />
          <div className={styles.mobileLogoWrap}>{logoEl}</div>
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

        <div className={styles.mobileSearchWrap}>
          <SearchBar
            compact
            placeholder={copy.searchPlaceholder}
            buttonLabel="⌕"
            searchLabel={copy.searchLabel}
            emptyQueryMessage={copy.searchEmptyQueryMessage}
          />
        </div>
      </div>
    </header>
  );
}
