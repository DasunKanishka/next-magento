import React from 'react';

import { Link } from '@/i18n/navigation';
import { STORE_IDENTITY } from '@/config/store-identity';
import { NewsletterSignup } from './NewsletterSignup';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

// Static footer link columns for this version. Admin-managed columns are a later
// version's authoring surface; here they are fixed content.
const COLUMNS: FooterColumn[] = [
  {
    heading: 'Assortiment',
    links: [
      { label: 'Whisky', href: '/whisky' },
      { label: 'Gin', href: '/gin' },
      { label: 'Rum', href: '/rum' },
      { label: 'Wijn', href: '/wijn' },
      { label: 'Champagne', href: '/champagne' },
      { label: 'Aanbiedingen', href: '/aanbiedingen' },
    ],
  },
  {
    heading: 'Klantenservice',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Verzending & retour', href: '/verzending' },
      { label: 'Veelgestelde vragen', href: '/faq' },
      { label: 'Bezorgstatus', href: '/bezorgstatus' },
    ],
  },
  {
    heading: `Over ${STORE_IDENTITY.name}`,
    links: [
      { label: 'Over ons', href: '/over-ons' },
      { label: 'Verantwoord genieten', href: '/verantwoord-genieten' },
      { label: 'Zakelijk bestellen', href: '/zakelijk' },
      { label: 'Vacatures', href: '/vacatures' },
    ],
  },
];

// Payment methods shown as labeled badges in the brand block.
const PAYMENT_METHODS = ['iDEAL', 'Visa', 'Mastercard', 'PayPal'];

const headingStyle: React.CSSProperties = {
  font: '700 13px/1 var(--font-brand)',
  color: '#fff',
  margin: '0 0 12px',
  letterSpacing: 'var(--type-tag-tracking)',
};

const linkStyle: React.CSSProperties = {
  // Full-width row so the tap target spans the column (>= 44px in both axes),
  // not just the text glyphs.
  display: 'flex',
  alignItems: 'center',
  minHeight: 'var(--tap-target-min)',
  font: '400 14px/1 var(--font-brand)',
  color: 'var(--color-text-on-brand)',
  textDecoration: 'none',
};

/**
 * Site footer, shared across every page. A brand block (wordmark, tagline,
 * payment badges) sits beside three static link columns and the newsletter
 * signup; the columns collapse to a two-column grid on mobile. A legal bottom
 * bar carries the copyright, the company registration number, and the explicit
 * 18+ / drink-responsibly notice. All links are real, keyboard-operable anchors.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'var(--color-brand-ink)',
        color: '#fff',
      }}
    >
      <style>{`
        .ftr-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
        .ftr-newsletter { grid-column: 1 / -1; }
        @media (max-width: 900px) {
          .ftr-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ftr-brand { grid-column: 1 / -1; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 'var(--layout-maxw)',
          margin: '0 auto',
          padding: '40px 20px 28px',
        }}
      >
        <div className="ftr-cols">
          <div className="ftr-brand">
            <Link
              href="/"
              aria-label={`${STORE_IDENTITY.name} — naar de homepagina`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 'var(--tap-target-min)',
                font: '800 22px/1 var(--font-brand)',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              {STORE_IDENTITY.name}
            </Link>
            <p
              style={{
                margin: '12px 0 16px',
                maxWidth: 320,
                font: '400 14px/1.6 var(--font-brand)',
                color: 'var(--color-text-on-brand)',
              }}
            >
              {STORE_IDENTITY.tagline}
            </p>
            <ul
              aria-label="Betaalmethoden"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {PAYMENT_METHODS.map((method) => (
                <li
                  key={method}
                  aria-label={method}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-brand-ink)',
                    borderRadius: 'var(--radius-sm)',
                    font: '700 11px/1 var(--font-brand)',
                  }}
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 style={headingStyle}>{col.heading}</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} style={linkStyle}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="ftr-newsletter">
            <NewsletterSignup />
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: 'var(--border-width-default) solid var(--color-surface-on-brand)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--layout-maxw)',
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            font: '400 12px/1.5 var(--font-brand)',
            color: 'var(--color-text-on-brand)',
          }}
        >
          <span>
            © {year} {STORE_IDENTITY.legalEntity} · {STORE_IDENTITY.registrationNumber}
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
