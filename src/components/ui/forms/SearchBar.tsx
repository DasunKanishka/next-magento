'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  placeholder?: string;
  buttonLabel?: string;
  /** Accessible label for the search input + the empty-query validation message. Both resolved to the store locale by default. */
  searchLabel?: string;
  emptyQueryMessage?: string;
  /**
   * Compact header row (shorter). Defaults to the taller standalone row. Both
   * heights keep the stretched controls at the minimum tap target.
   */
  compact?: boolean;
  /** Called with the trimmed, non-empty query on submit (Enter or button click), after navigation is triggered. */
  onSearch?: (value: string) => void;
  style?: React.CSSProperties;
}

/**
 * Primary site search — `--color-brand`-framed input with a `--color-cta`
 * action button. Fully interactive: focus ring, empty-query validation, and
 * on-submit navigation to `/zoeken?q=<value>` (the destination route itself
 * is out of scope here — this component only performs the navigation).
 *
 * Styling follows the co-located CSS module (see src/components/STYLING.md):
 * the focus ring (`:focus-within`), the invalid frame (`data-invalid`), and the
 * compact height (`data-compact`) are all state/attribute rules in the module,
 * so this component sets no `--local-*` bridge property.
 */
export function SearchBar({
  placeholder = getChromeCopy(defaultLocale).searchPlaceholder,
  buttonLabel = `⌕ ${getChromeCopy(defaultLocale).searchLabel}`,
  searchLabel = getChromeCopy(defaultLocale).searchLabel,
  emptyQueryMessage = getChromeCopy(defaultLocale).searchEmptyQueryMessage,
  compact = false,
  onSearch,
  style = {},
}: SearchBarProps) {
  const router = useRouter();
  const reactId = React.useId();
  const inputId = `searchbar-input-${reactId}`;
  const errorId = `searchbar-error-${reactId}`;

  const [value, setValue] = React.useState('');
  const [invalid, setInvalid] = React.useState(false);

  const submit = React.useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    router.push(`/zoeken?q=${encodeURIComponent(trimmed)}`);
    onSearch?.(trimmed);
  }, [value, router, onSearch]);

  return (
    <div className={styles.wrap} style={style}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={styles.row}
        data-compact={compact}
        data-invalid={invalid}
      >
        <label htmlFor={inputId} className={styles.srOnly}>
          {searchLabel}
        </label>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (invalid) setInvalid(false);
          }}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={styles.input}
        />
        <button type="submit" className={styles.submit}>
          {buttonLabel}
        </button>
      </form>
      {invalid ? (
        <p id={errorId} role="alert" className={styles.error}>
          {emptyQueryMessage}
        </p>
      ) : null}
    </div>
  );
}
