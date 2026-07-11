'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface SearchBarProps {
  placeholder?: string;
  buttonLabel?: string;
  /** Requested row height in px. Defaults to 50 (desktop); pass 44 for the mobile header row. The row's effective min-height is `max(height, 48)` so the border-box border never shrinks the stretched controls below the 44px tap-target minimum. */
  height?: number;
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
 */
export function SearchBar({
  placeholder = 'Zoek 8.000+ producten — merk, soort of cadeau…',
  buttonLabel = '⌕ Zoeken',
  height = 50,
  onSearch,
  style = {},
}: SearchBarProps) {
  const router = useRouter();
  const reactId = React.useId();
  const inputSelector = `searchbar-input-${reactId}`;
  const errorId = `searchbar-error-${reactId}`;

  const [value, setValue] = React.useState('');
  const [focused, setFocused] = React.useState(false);
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
    <div style={style}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{
          display: 'flex',
          // Stretch the input + button to the full row height so each is a
          // >=44px tap target (the 2px border makes a fixed-height row's content
          // box fall short otherwise).
          alignItems: 'stretch',
          border: `2px solid ${invalid ? 'var(--color-urgency)' : 'var(--color-brand)'}`,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          // Border-box: +4px for the 2px border so the content row (and thus
          // the stretched controls) is at least the 44px tap-target minimum.
          minHeight: Math.max(height, 48),
          boxShadow: focused ? 'var(--focus-ring)' : 'none',
          transition: 'box-shadow .15s ease',
        }}
      >
        {/* Scoped placeholder-color rule — a `::placeholder` pseudo-element
            cannot be targeted via inline style, so it is set through a
            minimally-scoped stylesheet keyed to this instance's generated id. */}
        <style>{`[data-searchbar-input="${inputSelector}"]::placeholder { color: var(--color-text-placeholder); }`}</style>
        <label htmlFor={inputSelector} style={visuallyHidden}>
          Zoeken
        </label>
        <input
          id={inputSelector}
          data-searchbar-input={inputSelector}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (invalid) setInvalid(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            padding: '0 18px',
            font: '400 14px/1 var(--font-brand)',
            background: 'transparent',
            color: 'var(--color-brand)',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--color-cta)',
            // Stretch to the row height (the flex row is `align-items: stretch`);
            // a percentage height would be undefined against the row's auto
            // height and collapse the button.
            alignSelf: 'stretch',
            minWidth: 'var(--tap-target-min)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 26px',
            font: '600 14px/1 var(--font-brand)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {buttonLabel}
        </button>
      </form>
      {invalid ? (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: '6px 0 0',
            font: '500 12px/1.3 var(--font-brand)',
            color: 'var(--color-urgency)',
          }}
        >
          {EMPTY_QUERY_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
