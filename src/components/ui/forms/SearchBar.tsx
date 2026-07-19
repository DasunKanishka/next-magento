'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import styles from './SearchBar.module.css';

export interface SearchBarProps {
  placeholder?: string;
  buttonLabel?: string;
  /**
   * Compact header row (shorter). Defaults to the taller standalone row. Both
   * heights keep the stretched controls at the minimum tap target.
   */
  compact?: boolean;
  /** Called with the trimmed, non-empty query on submit (Enter or button click), after navigation is triggered. */
  onSearch?: (value: string) => void;
  style?: React.CSSProperties;
}

const EMPTY_QUERY_MESSAGE = 'Vul een zoekterm in om te zoeken.';

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
  placeholder = 'Zoek 8.000+ producten — merk, soort of cadeau…',
  buttonLabel = '⌕ Zoeken',
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
          Zoeken
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
          {EMPTY_QUERY_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
