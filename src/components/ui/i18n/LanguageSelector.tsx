'use client';

import React from 'react';

import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { findLanguageByLocale, languages } from '@/i18n/languages';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { languageDisplayName } from '@/i18n/display-names';
import codeChipStyles from '../core/codeChip.module.css';
import { useDismissMenu } from '../core/useDismissMenu';
import { Checkmark, Chevron, styles } from './selectorShared';

export interface LanguageSelectorProps {
  /** Active UI language locale. Defaults to the store-scope default locale. */
  value?: SupportedLocale;
  /** Compact mode: code chip + chevron only, used in the age gate / mobile menu. */
  compact?: boolean;
  /** Flip the dropdown anchor to the left edge (edge-of-screen placement). */
  alignLeft?: boolean;
  /** Trigger label shown in full mode. Defaults to the store-locale catalog's label. */
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
  label,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const firstOptionRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const { rootRef, onPanelKeyDown } = useDismissMenu(open, close, triggerRef);
  // Store-locale chrome copy, resolved from the active UI language itself
  // (`value` already carries the request-resolved `SupportedLocale`).
  const copy = getChromeCopy(value);
  const columnLabel = label ?? copy.languageColumnLabel;

  React.useEffect(() => {
    if (open) firstOptionRef.current?.focus();
  }, [open]);

  const current = findLanguageByLocale(value) ?? languages[0];
  // Every language name is resolved IN the active UI locale (`value`), not the
  // entry's own language — a store-locale-correct name, per Intl.DisplayNames,
  // never a hardcoded table (see `./display-names.ts`).
  const currentName = languageDisplayName(value, current.locale);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.languageSelectorAriaLabel(currentName)}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
      >
        <span className={`${codeChipStyles.codeChip} ${codeChipStyles.codeChipActive}`}>
          {current.code}
        </span>
        {!compact && (
          <span className={styles.triggerStack}>
            <span className={styles.triggerLabel}>{columnLabel}</span>
            <span className={styles.triggerValue}>{currentName}</span>
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={columnLabel}
          onKeyDown={onPanelKeyDown}
          className={`${styles.panel} ${styles.panelLang} ${
            alignLeft ? styles.panelLeft : styles.panelRight
          }`}
        >
          <div role="group" aria-label={columnLabel} className={styles.column}>
            <div className={styles.columnHeading}>{columnLabel}</div>
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
                    className={`${codeChipStyles.codeChip} ${
                      active ? codeChipStyles.codeChipActive : ''
                    }`}
                  >
                    {l.code}
                  </span>
                  <span className={styles.optionGrow}>
                    {languageDisplayName(value, l.locale)}
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
