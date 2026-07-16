'use client';

import React from 'react';

import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { findLanguageByLocale, languages } from '@/i18n/languages';
import {
  Checkmark,
  Chevron,
  handleMenuArrowKeys,
  styles,
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
 * the 44×44px minimum tap target. Styling lives in the shared selector module
 * (see src/components/STYLING.md).
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
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Taal: ${current.name}. Kies taal`}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
      >
        <span className={`${styles.codeChip} ${styles.codeChipActive}`}>
          {current.code}
        </span>
        {!compact && (
          <span className={styles.triggerStack}>
            <span className={styles.triggerLabel}>{label}</span>
            <span className={styles.triggerValue}>{current.name}</span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Taal"
          onKeyDown={handleMenuArrowKeys}
          className={`${styles.panel} ${styles.panelLang} ${
            alignLeft ? styles.panelLeft : styles.panelRight
          }`}
        >
          <div role="group" aria-label="Taal" className={styles.column}>
            <div className={styles.columnHeading}>Taal</div>
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
