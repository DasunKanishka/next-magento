import React from 'react';

import { Link } from '@/i18n/navigation';
import type { StoreIdentity } from '@/lib/data-source';
import { NewsletterSignup } from './NewsletterSignup';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Store identity resolved by the caller (`getStoreIdentity()`) and threaded down — Footer never fetches it itself. */
  identity: StoreIdentity;
}

/**
 * Site footer, shared across every page. A brand block (wordmark, tagline,
 * payment badges) sits beside the backend-authored link columns and the
 * newsletter signup; the columns collapse to a two-column grid on mobile. A
 * legal bottom bar carries the copyright, the company registration number,
 * and the explicit 18+ / drink-responsibly notice. All links are real,
 * keyboard-operable anchors.
 */
export function Footer({ identity }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          <div className={styles.brand}>
            <Link
              href="/"
              aria-label={`${identity.name} — naar de homepagina`}
              className={styles.wordmark}
            >
              {identity.name}
            </Link>
            <p className={styles.tagline}>{identity.tagline}</p>
            <ul aria-label="Betaalmethoden" className={styles.payments}>
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
            <NewsletterSignup />
          </div>
        </div>
      </div>

      <div className={styles.legal}>
        <div className={styles.legalInner}>
          <span>
            © {year} {identity.copyright} · {identity.registrationNumber}
          </span>
          <span>
            18+ Verkoop van alcohol alleen aan personen van 18 jaar en ouder · Geniet,
            maar drink met mate.
          </span>
        </div>
      </div>
    </footer>
  );
}
