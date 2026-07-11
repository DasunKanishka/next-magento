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
  codeChipStyle,
  columnHeadingStyle,
  Flag,
  handleMenuArrowKeys,
  optionActiveTealStyle,
  optionBaseStyle,
  panelStyle,
  triggerBaseStyle,
  triggerLabelStyle,
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
 * modes (`full`/`compact`) meet the 44×44px minimum tap target.
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
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Bezorgland: ${country.name}. Kies land en taal`}
        onClick={() => setOpen((o) => !o)}
        style={{
          ...triggerBaseStyle,
          ...(compact ? { gap: 6, padding: '0 10px' } : {}),
        }}
      >
        <Flag src={country.flag} size={compact ? 18 : 22} />
        {!compact && (
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <span style={triggerLabelStyle}>{label}</span>
            <span
              style={{
                font: '600 14px/1 var(--font-brand)',
                color: 'var(--color-brand)',
              }}
            >
              {country.name}
            </span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Land en taal"
          onKeyDown={handleMenuArrowKeys}
          style={panelStyle(alignLeft)}
        >
          <div role="group" aria-label="Land" style={{ minWidth: 190 }}>
            <div style={columnHeadingStyle}>Land</div>
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
                  style={{ ...optionBaseStyle, ...(active ? optionActiveTealStyle : {}) }}
                >
                  <Flag src={c.flag} size={20} />
                  <span style={{ flex: 1 }}>{c.name}</span>
                  {active && <Checkmark />}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Taal"
            style={{
              minWidth: 170,
              borderLeft: 'var(--border-width-default) solid var(--color-border-card)',
              paddingLeft: 8,
            }}
          >
            <div style={columnHeadingStyle}>Taal</div>
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
                  style={optionBaseStyle}
                >
                  <span style={codeChipStyle(active)}>{l.code}</span>
                  <span style={{ flex: 1 }}>{l.name}</span>
                  {active && (
                    <span style={{ color: 'var(--color-brand)', display: 'inline-flex' }}>
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
