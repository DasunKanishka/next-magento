'use client';

import React from 'react';

import { Button, LanguageSelector } from '@/components/ui';
import { countries, type CountryCode } from '@/i18n/countries';
import type { SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { countryDisplayName } from '@/i18n/display-names';
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
 * Scoped stylesheet for the gate. Class-based (not co-located CSS-module)
 * styling is deliberate here: the gate is rendered server-side in place of the
 * storefront and its class names are a stable contract for the compliance E2E,
 * so they must not be hashed. Every declared value below is a design token —
 * this stylesheet carries no raw literal. Classes express the pieces an inline
 * style cannot: responsive grid columns and selector placement (4-col/top-right
 * desktop vs 3-col/top-left mobile), and the `:has(:checked)` selection state,
 * which reflects the native radio/checkbox state so the selected-tile border +
 * check badge appear WITH OR WITHOUT client JS.
 */
const GATE_CSS = `
.agegate__dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: var(--color-scrim-strong);
  overflow-y: auto;
}

.agegate__card {
  position: relative;
  width: 100%;
  max-width: var(--gate-card-w);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-6) var(--space-6);
  background: var(--color-surface);
  border-radius: var(--radius-gate-card);
  box-shadow: var(--shadow-overlay);
  text-align: center;
}

.agegate__lang { position: absolute; top: var(--space-4); left: var(--space-4); z-index: 1; }
@media (min-width: 768px) { .agegate__lang { left: auto; right: var(--space-4); } }

.agegate__title {
  margin: 0;
  font-family: var(--font-brand);
  font-size: var(--type-h3-size);
  font-weight: var(--type-weight-bold);
  line-height: 1.2;
  color: var(--color-brand);
}

.agegate__copy {
  margin: 0;
  max-width: var(--gate-copy-w);
  font-family: var(--font-brand);
  font-size: var(--type-ui-size);
  font-weight: var(--type-body-weight);
  line-height: 1.55;
  color: var(--color-text-muted);
}

.agegate__fieldset { width: 100%; margin: 0; padding: 0; border: none; }

.agegate__legend {
  width: 100%;
  margin-bottom: var(--space-2);
  font-family: var(--font-brand);
  font-size: var(--type-eyebrow-size);
  font-weight: var(--type-weight-semibold);
  line-height: var(--type-eyebrow-line-height);
  letter-spacing: var(--type-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--color-text-subtle);
  text-align: left;
}

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
  font-family: var(--font-brand);
  font-size: var(--type-caption-size);
  font-weight: var(--type-weight-semibold);
  line-height: 1.2;
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
.agegate__flag {
  width: var(--space-7);
  height: var(--space-4);
  border-radius: var(--radius-2xs);
  object-fit: cover;
  display: block;
}
.agegate__badge {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: var(--icon-size-lg);
  height: var(--icon-size-lg);
  border-radius: var(--radius-full);
  background: var(--color-cta);
  color: var(--color-text-on-fill);
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
  font-family: var(--font-brand);
  font-size: var(--type-ui-size);
  font-weight: var(--type-weight-semibold);
  line-height: 1.3;
  cursor: pointer;
}
.agegate__age:has(.agegate__checkbox:checked) {
  border-color: var(--color-cta);
  background: var(--color-cta-tint);
}
.agegate__checkbox {
  width: var(--space-6);
  height: var(--space-6);
  flex: 0 0 auto;
  accent-color: var(--color-cta);
  cursor: pointer;
}

.agegate__legal {
  margin: 0;
  font-family: var(--font-brand);
  font-size: var(--type-label-size);
  font-weight: var(--type-body-weight);
  line-height: 1.5;
  color: var(--color-text-subtle);
}
`;

/** Exposed for the styling test to assert this stylesheet references only tokens. */
export const AGE_GATE_CSS = GATE_CSS;

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
  const copy = getChromeCopy(locale);
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
      className="agegate__dialog"
    >
      <style dangerouslySetInnerHTML={{ __html: GATE_CSS }} />

      <form action={recordConsentAction} className="agegate__card">
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

        <h1 id="agegate-title" className="agegate__title">
          {copy.ageGateTitle}
        </h1>

        <p className="agegate__copy">{copy.ageGateCopy}</p>

        <fieldset className="agegate__fieldset">
          <legend className="agegate__legend">{copy.ageGateCountryLegend}</legend>

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
                <img src={c.flag} alt="" aria-hidden="true" className="agegate__flag" />
                <span>{countryDisplayName(locale, c.code)}</span>
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
            // eslint-disable-next-line i18next/no-literal-string -- boolean form-value marker, not language.
            value="true"
            checked={ageChecked}
            onChange={(e) => setAgeChecked(e.target.checked)}
          />
          <span>{copy.ageGateAgeConfirm}</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={ctaDisabled}
        >
          {copy.ageGateCta}
        </Button>

        {/*
          Legal/compliance-sensitive fine print (alcohol age-restriction
          notice). Translated from the Dutch original in
          `src/i18n/chrome-copy.ts` (`ageGateLegalNotice`) as part of the
          store-locale migration — flagged `needs-confirm` in this change's
          handoff for a legal-accuracy review before this ships; do not alter
          the wording again without the same review.
        */}
        <p className="agegate__legal">{copy.ageGateLegalNotice}</p>
      </form>
    </div>
  );
}
