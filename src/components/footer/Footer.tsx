import React from 'react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/ui/core/Logo';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import type { StoreIdentity } from '@/lib/data-source';
import { NewsletterSignup } from './NewsletterSignup';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Store identity resolved by the caller (`getStoreIdentity()`) and threaded down — Footer never fetches it itself. */
  identity: StoreIdentity;
  /** Active locale — resolved from `storeConfig` by the caller. */
  locale?: SupportedLocale;
}

/**
 * Site footer, shared across every page. A brand block (wordmark, tagline,
 * payment badges) sits beside the backend-authored link columns and the
 * newsletter signup; the columns collapse to a two-column grid on mobile. A
 * legal bottom bar carries the copyright, the company registration number,
 * and the explicit 18+ / drink-responsibly notice. All links are real,
 * keyboard-operable anchors.
 */
export function Footer({ identity, locale = defaultLocale }: FooterProps) {
  const year = new Date().getFullYear();
  const copy = getChromeCopy(locale);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          <div className={styles.brand}>
            <Logo logo={identity.logo} className={styles.wordmark} />
            <p className={styles.tagline}>{identity.tagline}</p>
            <ul aria-label={copy.footerPaymentMethods} className={styles.payments}>
              {identity.paymentMethods.map((method) => (
                <li key={method} aria-label={method} className={styles.payment}>
                  {method}
                </li>
              ))}
            </ul>
          </div>

          {identity.footerColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className={styles.heading}>{col.heading}</h2>
              <ul className={styles.list}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className={styles.newsletter}>
            <NewsletterSignup locale={locale} />
          </div>
        </div>
      </div>

      <div className={styles.legal}>
        <div className={styles.legalInner}>
          <span>
            © {year} {identity.copyright} · {identity.registrationNumber}
          </span>
          {/*
            Alcohol legal-compliance notice — backend-sourced via
            `getStoreIdentity()` (`identity.alcoholLegalNotice`, a native CMS
            block the merchant/legal team owns, see
            `src/config/store-identity-content.ts`). Renders gracefully empty
            (never a hardcoded fallback) when unauthored — see that module's
            doc comment for why this field degrades rather than fail-closes.
            `data-testid` (content-agnostic — the wording is merchant-owned
            and intentionally NOT asserted by any E2E spec outside the
            dedicated round-trip test) lets E2E assert the notice RENDERS
            without coupling to its current wording.
          */}
          {identity.alcoholLegalNotice !== '' && (
            <span data-testid="alcohol-legal-notice">{identity.alcoholLegalNotice}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
