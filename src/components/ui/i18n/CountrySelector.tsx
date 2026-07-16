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
import {
  Checkmark,
  Chevron,
  Flag,
  handleMenuArrowKeys,
  styles,
  useDismiss,
} from './selectorShared';

export interface CountrySelectorProps {
  /** Active delivery country. Defaults to Nederland. */
  value?: CountryCode;
  /** Active UI language locale (drives the right column's active state). */
  language?: SupportedLocale;
  /** Compact mode: flag + chevron only (~34px), used in the mobile header. */
  compact?: boolean;
  /** Flip the dropdown anchor to the left edge (edge-of-screen placement). */
  alignLeft?: boolean;
  /** Trigger label shown in full mode. */
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
  label = 'Bezorgen naar',
  onCountryChange,
  onLanguageChange,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const firstOptionRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const rootRef = useDismiss(open, close, triggerRef);

  React.useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  const country = findCountry(value) ?? countries[0];

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Bezorgland: ${country.name}. Kies land en taal`}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
      >
        <Flag src={country.flag} size={compact ? 18 : 22} />
        {!compact && (
          <span className={styles.triggerStack}>
            <span className={styles.triggerLabel}>{label}</span>
            <span className={styles.triggerValue}>{country.name}</span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Land en taal"
          onKeyDown={handleMenuArrowKeys}
          className={`${styles.panel} ${alignLeft ? styles.panelLeft : styles.panelRight}`}
        >
          <div role="group" aria-label="Land" className={styles.columnCountry}>
            <div className={styles.columnHeading}>Land</div>
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
                  <span className={styles.optionGrow}>{c.name}</span>
                  {active && <Checkmark />}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Taal" className={styles.columnLang}>
            <div className={styles.columnHeading}>Taal</div>
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
                    className={`${styles.codeChip} ${active ? styles.codeChipActive : ''}`}
                  >
                    {l.code}
                  </span>
                  <span className={styles.optionGrow}>{l.name}</span>
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
