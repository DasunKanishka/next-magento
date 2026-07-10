'use client';

import React from 'react';

import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { findLanguageByLocale, languages } from '@/i18n/languages';
import {
  Checkmark,
  Chevron,
  codeChipStyle,
  columnHeadingStyle,
  optionBaseStyle,
  panelStyle,
  triggerBaseStyle,
  triggerLabelStyle,
  useDismiss,
} from './selectorShared';

export interface LanguageSelectorProps {
  /** Active UI language locale. Defaults to Nederlands. */
  value?: SupportedLocale;
  /** Compact mode: code chip + chevron only, used in the age gate / mobile menu. */
  compact?: boolean;
  /** Flip the dropdown anchor to the left edge (edge-of-screen placement). */
  alignLeft?: boolean;
  /** Trigger label shown in full mode. */
  label?: string;
  onLanguageChange?: (locale: SupportedLocale) => void;
}

/**
 * Standalone language selector — a single-column language list. Closes on
 * selection, click-outside, or Esc. Both render modes (`full`/`compact`) meet
 * the 44×44px minimum tap target.
 */
export function LanguageSelector({
  value = defaultLocale,
  compact = false,
  alignLeft = false,
  label = 'Taal',
  onLanguageChange,
}: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const firstOptionRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const rootRef = useDismiss(open, close, triggerRef);

  React.useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  const current = findLanguageByLocale(value) ?? languages[0];

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Taal: ${current.name}. Kies taal`}
        onClick={() => setOpen((o) => !o)}
        style={{
          ...triggerBaseStyle,
          ...(compact ? { gap: 6, padding: '0 10px' } : {}),
        }}
      >
        <span style={codeChipStyle(true)}>{current.code}</span>
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
              {current.name}
            </span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Taal"
          style={{ ...panelStyle(alignLeft), minWidth: 180 }}
        >
          <div style={{ width: '100%' }}>
            <div style={columnHeadingStyle}>Taal</div>
            {languages.map((l, index) => {
              const active = l.locale === value;
              return (
                <button
                  key={l.code}
                  ref={index === 0 ? firstOptionRef : undefined}
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
