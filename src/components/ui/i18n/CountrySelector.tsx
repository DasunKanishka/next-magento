'use client';

import React from 'react';

import {
  countries,
  defaultCountryCode,
  findCountry,
  type CountryCode,
} from '@/i18n/countries';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { languages } from '@/i18n/languages';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { countryDisplayName, languageDisplayName } from '@/i18n/display-names';
import codeChipStyles from '../core/codeChip.module.css';
import { useDismissMenu } from '../core/useDismissMenu';
import { Checkmark, Chevron, Flag, styles } from './selectorShared';

export interface CountrySelectorProps {
  /** Active delivery country. Defaults to the Netherlands (`NL`). */
  value?: CountryCode;
  /** Active UI language locale (drives the right column's active state). */
  language?: SupportedLocale;
  /** Compact mode: flag + chevron only (~34px), used in the mobile header. */
  compact?: boolean;
  /** Flip the dropdown anchor to the left edge (edge-of-screen placement). */
  alignLeft?: boolean;
  /** Trigger label shown in full mode. Defaults to the store-locale catalog's label. */
  label?: string;
  onCountryChange?: (code: CountryCode) => void;
  onLanguageChange?: (locale: SupportedLocale) => void;
}

/**
 * Header country selector with a two-column dropdown: delivery countries on the
 * left (teal-tint active + checkmark), UI languages on the right (navy code-chip
 * active + checkmark). Closes on selection, click-outside, or Esc. Both render
 * modes (`full`/`compact`) meet the 44×44px minimum tap target. Styling lives in
 * the shared selector module (see src/components/STYLING.md).
 */
export function CountrySelector({
  value = defaultCountryCode,
  language = defaultLocale,
  compact = false,
  alignLeft = false,
  label,
  onCountryChange,
  onLanguageChange,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const firstOptionRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const { rootRef, onPanelKeyDown } = useDismissMenu(open, close, triggerRef);
  // Store-locale chrome copy, resolved from the active UI language.
  const copy = getChromeCopy(language);
  const triggerLabel = label ?? copy.deliverToLabel;

  React.useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  const country = findCountry(value) ?? countries[0];
  // Every country/language name is resolved IN the active UI locale
  // (`language`), not the entry's own code — a store-locale-correct name,
  // per Intl.DisplayNames, never a hardcoded table (see `./display-names.ts`).
  const countryName = countryDisplayName(language, country.code);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.countrySelectorAriaLabel(countryName)}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
      >
        <Flag src={country.flag} size={compact ? 18 : 22} />
        {!compact && (
          <span className={styles.triggerStack}>
            <span className={styles.triggerLabel}>{triggerLabel}</span>
            <span className={styles.triggerValue}>{countryName}</span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={copy.countryAndLanguagePanelLabel}
          onKeyDown={onPanelKeyDown}
          className={`${styles.panel} ${alignLeft ? styles.panelLeft : styles.panelRight}`}
        >
          <div
            role="group"
            aria-label={copy.countryColumnLabel}
            className={styles.columnCountry}
          >
            <div className={styles.columnHeading}>{copy.countryColumnLabel}</div>
            {countries.map((c, index) => {
              const active = c.code === value;
              return (
                <button
                  key={c.code}
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onCountryChange?.(c.code);
                    close();
                    triggerRef.current?.focus();
                  }}
                  className={`${styles.option} ${active ? styles.optionActiveTeal : ''}`}
                >
                  <Flag src={c.flag} size={20} />
                  <span className={styles.optionGrow}>
                    {countryDisplayName(language, c.code)}
                  </span>
                  {active && <Checkmark />}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label={copy.languageColumnLabel}
            className={styles.columnLang}
          >
            <div className={styles.columnHeading}>{copy.languageColumnLabel}</div>
            {languages.map((l) => {
              const active = l.locale === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onLanguageChange?.(l.locale);
                    close();
                    triggerRef.current?.focus();
                  }}
                  className={styles.option}
                >
                  <span
                    className={`${codeChipStyles.codeChip} ${
                      active ? codeChipStyles.codeChipActive : ''
                    }`}
                  >
                    {l.code}
                  </span>
                  <span className={styles.optionGrow}>
                    {languageDisplayName(language, l.locale)}
                  </span>
                  {active && (
                    <span className={styles.checkIcon}>
                      <Checkmark />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
