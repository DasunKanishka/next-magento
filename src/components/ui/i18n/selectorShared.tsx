'use client';

import React from 'react';

import styles from './selectorShared.module.css';

/**
 * Shared primitives for the i18n selectors (CountrySelector / LanguageSelector).
 * These are internal to the two selector components — not exported from the
 * public barrel. All styling lives in the co-located `selectorShared.module.css`
 * (see src/components/STYLING.md); this file exports the shared `styles` object
 * plus the behavior/SVG helpers both selectors consume.
 */

export { styles };

export type SelectorMode = 'full' | 'compact';

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

/**
 * Roving-focus keydown handler for an open dropdown panel. ArrowDown/ArrowUp
 * move focus across every option (`menuitemradio`) in the panel, with
 * wrap-around, so the whole open list is operable by keyboard alone (Home/End
 * jump to the first/last option). Attach to the `role="menu"` container; the
 * trigger's Esc-close/focus-return stays owned by `useDismiss`.
 */
export function handleMenuArrowKeys(event: React.KeyboardEvent<HTMLElement>): void {
  const { key } = event;
  if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') {
    return;
  }
  const panel = event.currentTarget;
  const items = Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitemradio"]'));
  if (items.length === 0) return;

  event.preventDefault();
  const active = document.activeElement as HTMLElement | null;
  const current = active ? items.indexOf(active) : -1;

  let next: number;
  if (key === 'Home') next = 0;
  else if (key === 'End') next = items.length - 1;
  else {
    const delta = key === 'ArrowDown' ? 1 : -1;
    next = current === -1 ? 0 : (current + delta + items.length) % items.length;
  }
  items[next]?.focus();
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
      className={styles.flag}
    />
  );
}
