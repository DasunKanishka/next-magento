'use client';

import React from 'react';

import { Button, LanguageSelector } from '@/components/ui';
import { countries, type CountryCode } from '@/i18n/countries';
import type { SupportedLocale } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';

export interface AgeGateProps {
  /** Active locale — drives the embedded `LanguageSelector` and the hidden form field. */
  locale: SupportedLocale;
  /**
   * The `recordConsent` Server Action, passed from the server layout. Bound to
   * the gate `<form>` so submission works even with client JS disabled.
   */
  recordConsentAction: (formData: FormData) => void | Promise<void>;
}

/**
 * Role-map literals — the ONLY place non-token values live in this file
 * (mirrors the component library's brand-neutrality convention, e.g.
 * `Button`'s `PALETTE`). Everything else references `var(--contract-name)`.
 *
 * `SCRIM` is the entry-gate overlay color; there is no contract
 * token for a modal scrim, so it is a documented literal here. `#fff` is the
 * on-`--color-cta` check glyph color (navy/green have no on-fill text token,
 * same as `Button`'s `#fff` on the CTA fill).
 */
const SCRIM = 'rgba(4,12,28,.55)';
const CHECK_ON_CTA = '#fff';

/** EXACT legal fine-print string — do not alter wording or the middot separator. */
const LEGAL_NOTICE =
  'Geen verkoop van alcohol onder de 18 jaar · Geniet, maar drink met mate';

/**
 * Scoped stylesheet for the gate. Class-based (not inline) styling is used for
 * the pieces that inline styles cannot express: responsive grid columns and
 * selector placement (4-col/top-right desktop vs 3-col/top-left mobile), and
 * the `:has(:checked)` selection state — which reflects the native radio/checkbox
 * state so the selected-tile border + check badge appear WITH OR WITHOUT client
 * JS. Every `var(--*)` below is a real contract key.
 */
const GATE_CSS = `
.agegate__card { border-radius: var(--radius-2xl); }
@media (min-width: 768px) { .agegate__card { border-radius: var(--radius-lg); } }

.agegate__lang { position: absolute; top: var(--space-4); left: var(--space-4); z-index: 1; }
@media (min-width: 768px) { .agegate__lang { left: auto; right: var(--space-4); } }

.agegate__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  width: 100%;
}
@media (min-width: 768px) {
  .agegate__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.agegate__tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: var(--tap-target-min);
  padding: var(--space-3) var(--space-2);
  border: var(--border-width-emphasis) solid var(--color-border-field);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: 600 13px/1.2 var(--font-brand);
  text-align: center;
  cursor: pointer;
}
.agegate__tile:has(.agegate__radio:checked) {
  border-color: var(--color-cta);
  background: var(--color-cta-tint);
  box-shadow: var(--shadow-cta);
}
.agegate__tile:has(.agegate__radio:focus-visible) {
  outline: none;
  box-shadow: var(--focus-ring);
}
.agegate__radio {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: 0;
  opacity: 0;
}
.agegate__badge {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--color-cta);
  color: ${CHECK_ON_CTA};
  display: none;
  align-items: center;
  justify-content: center;
}
.agegate__tile:has(.agegate__radio:checked) .agegate__badge { display: inline-flex; }

.agegate__age {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--tap-target-min);
  padding: var(--space-3);
  border: var(--border-width-default) solid var(--color-border-card);
  border-radius: var(--radius-md);
  background: var(--color-surface-inset-a);
  color: var(--color-text-primary);
  font: 600 14px/1.3 var(--font-brand);
  cursor: pointer;
}
.agegate__age:has(.agegate__checkbox:checked) {
  border-color: var(--color-cta);
  background: var(--color-cta-tint);
}
.agegate__checkbox {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  accent-color: var(--color-cta);
  cursor: pointer;
}
`;

/** Selected-tile check badge glyph. */
function BadgeCheck() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 14 14">
      <path
        d="M2.5 7.5 5.5 10.5 11.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Brand-neutral emblem — decorative; the H1 is the accessible heading. */
function GateMark() {
  return (
    <svg
      aria-hidden="true"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{ display: 'block' }}
    >
      <circle cx="20" cy="20" r="19" fill="var(--color-brand)" />
      <path
        d="M20 9c4 6 6.5 9.2 6.5 12.6A6.5 6.5 0 0 1 20 28a6.5 6.5 0 0 1-6.5-6.4C13.5 18.2 16 15 20 9Z"
        fill="var(--color-cta)"
      />
    </svg>
  );
}

/**
 * Mandatory 18+/country entry gate — the alcohol-compliance control. Rendered
 * by the locale layout IN PLACE OF the storefront when
 * `hasConsented()` is false, so the storefront HTML is never sent — the gate is
 * non-bypassable with client JS disabled.
 *
 * Progressive enhancement: the whole gate is a `<form>` bound to the
 * `recordConsent` Server Action with native radio/checkbox inputs, so it submits
 * and is validated server-side without any client JS. Client JS then enhances
 * the experience — it disables the CTA until a country is selected AND 18+ is
 * confirmed. Before hydration (and therefore with JS disabled) the CTA is
 * enabled so a no-JS visitor can submit and be validated on the server.
 */
export function AgeGate({ locale, recordConsentAction }: AgeGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [country, setCountry] = React.useState<CountryCode | ''>('');
  const [ageChecked, setAgeChecked] = React.useState(false);
  // `false` during SSR + hydration, `true` once client JS is live. Drives the
  // progressive-enhancement CTA gating without a setState-in-effect cascade.
  const hydrated = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const valid = country !== '' && ageChecked;
  // Only gate the CTA once JS is running; a no-JS render keeps it submittable.
  const ctaDisabled = hydrated && !valid;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        background: SCRIM,
        overflowY: 'auto',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: GATE_CSS }} />

      <form
        action={recordConsentAction}
        className="agegate__card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-8) var(--space-6) var(--space-6)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-overlay)',
          textAlign: 'center',
        }}
      >
        <input type="hidden" name="locale" value={locale} />

        <div className="agegate__lang">
          <LanguageSelector
            compact
            alignLeft
            value={locale}
            onLanguageChange={(next) => {
              if (next !== locale) router.replace(pathname, { locale: next });
            }}
          />
        </div>

        <GateMark />

        <h1
          id="agegate-title"
          style={{
            margin: 0,
            font: '700 22px/1.2 var(--font-brand)',
            color: 'var(--color-brand)',
          }}
        >
          Waar mogen we naartoe bezorgen?
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: 380,
            font: '400 14px/1.55 var(--font-brand)',
            color: 'var(--color-text-muted)',
          }}
        >
          Kies je bezorgland en bevestig je leeftijd om de winkel te betreden.
        </p>

        <fieldset
          style={{
            width: '100%',
            margin: 0,
            padding: 0,
            border: 'none',
          }}
        >
          <legend
            style={{
              width: '100%',
              marginBottom: 'var(--space-2)',
              font: '600 11px/1 var(--font-brand)',
              letterSpacing: 'var(--type-eyebrow-tracking)',
              textTransform: 'uppercase',
              color: 'var(--color-text-subtle)',
              textAlign: 'left',
            }}
          >
            Bezorgland
          </legend>

          <div className="agegate__grid">
            {countries.map((c) => (
              <label key={c.code} className="agegate__tile">
                <input
                  className="agegate__radio"
                  type="radio"
                  name="country"
                  value={c.code}
                  checked={country === c.code}
                  onChange={() => setCountry(c.code)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.flag}
                  alt=""
                  aria-hidden="true"
                  width={26}
                  height={17}
                  style={{ borderRadius: 2, objectFit: 'cover', display: 'block' }}
                />
                <span>{c.name}</span>
                <span className="agegate__badge" aria-hidden="true">
                  <BadgeCheck />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="agegate__age">
          <input
            className="agegate__checkbox"
            type="checkbox"
            name="ageConfirmed"
            value="true"
            checked={ageChecked}
            onChange={(e) => setAgeChecked(e.target.checked)}
          />
          <span>Ja, ik ben 18 jaar of ouder</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={ctaDisabled}
        >
          De winkel betreden →
        </Button>

        <p
          style={{
            margin: 0,
            font: '400 12px/1.5 var(--font-brand)',
            color: 'var(--color-text-subtle)',
          }}
        >
          {LEGAL_NOTICE}
        </p>
      </form>
    </div>
  );
}
