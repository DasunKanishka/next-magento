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
