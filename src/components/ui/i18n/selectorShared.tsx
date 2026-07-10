'use client';

import React from 'react';

/**
 * Shared primitives for the i18n selectors (CountrySelector / LanguageSelector).
 * These are internal to the two selector components — not exported from the
 * public barrel. Per the component-library convention, every literal color/size
 * lives in a role-map here; consumers reference only these primitives and
 * `var(--contract-name)` tokens.
 */

export type SelectorMode = 'full' | 'compact';

const FONT_UI = '500 14px/1 var(--font-brand)';
const FONT_LABEL = '600 11px/1 var(--font-brand)';

/**
 * Closes an open dropdown on an outside click or the Escape key, and returns
 * focus to the trigger on Escape. Returns a ref to attach to the selector root
 * (trigger + panel) so clicks *inside* it do not count as "outside".
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
): React.RefObject<HTMLDivElement | null> {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  return rootRef;
}

/** Down chevron; rotates when the dropdown is open. */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      style={{
        flex: '0 0 auto',
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform .15s ease',
      }}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Selected-state checkmark, tinted via `currentColor`. */
export function Checkmark() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
      <path
        d="M2.5 7.5 5.5 10.5 11.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Base style for the trigger button — meets the 44×44px minimum tap target. */
export const triggerBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 'var(--tap-target-min)',
  minWidth: 'var(--tap-target-min)',
  padding: '0 12px',
  background: 'var(--color-surface)',
  border: 'var(--border-width-emphasis) solid var(--color-border-field)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  font: FONT_UI,
  cursor: 'pointer',
};

/** "Bezorgen naar"-style muted label above the trigger value. */
export const triggerLabelStyle: React.CSSProperties = {
  font: FONT_LABEL,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-eyebrow-tracking)',
};

/** The floating dropdown surface. `alignLeft` anchors it to the left edge. */
export function panelStyle(alignLeft: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    ...(alignLeft ? { left: 0 } : { right: 0 }),
    zIndex: 50,
    background: 'var(--color-surface)',
    border: 'var(--border-width-default) solid var(--color-border-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-overlay)',
    padding: 8,
    display: 'flex',
    gap: 8,
  };
}

/** A single option row (country or language) — always a real button. */
export const optionBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  minHeight: 'var(--tap-target-min)',
  padding: '0 12px',
  background: 'transparent',
  border: 'var(--border-width-default) solid transparent',
  borderRadius: 'var(--radius-sm)',
  font: FONT_UI,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
};

/** Active/selected option style: left-column country uses a teal tint. */
export const optionActiveTealStyle: React.CSSProperties = {
  background: 'var(--color-trust-tint)',
  border: 'var(--border-width-default) solid var(--color-trust-tint-border)',
  color: 'var(--color-trust)',
};

/** 2-letter language code chip. `active` = navy fill, else muted inset. */
export function codeChipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
    padding: '3px 6px',
    borderRadius: 'var(--radius-sm)',
    font: '700 11px/1 var(--font-brand)',
    background: active ? 'var(--color-brand)' : 'var(--color-surface-inset-b)',
    // White chip text on the navy active fill is a role-map literal (mirrors
    // Button's `#fff` on `--color-cta`) — navy has no on-fill text token.
    color: active ? '#fff' : 'var(--color-text-muted)',
  };
}

/** Flag image (inline data-URI SVG), rendered at chip size. */
export function Flag({ src, size = 20 }: { src: string; size?: number }) {
  return (
    // Decorative: the adjacent country name is the accessible label.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round((size * 2) / 3)}
      style={{
        flex: '0 0 auto',
        borderRadius: 2,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

/** Column heading inside a dropdown (e.g. "Land" / "Taal"). */
export const columnHeadingStyle: React.CSSProperties = {
  font: FONT_LABEL,
  color: 'var(--color-text-subtle)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--type-eyebrow-tracking)',
  padding: '4px 12px 6px',
};
