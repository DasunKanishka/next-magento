import React from 'react';

import styles from './Toast.module.css';
import { FEEDBACK_TONE_FAMILIES, FEEDBACK_TONE_ICONS, type FeedbackTone } from './tone';

export type ToastTone = FeedbackTone;

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ToastTone;
  children?: React.ReactNode;
}

/**
 * Per-tone icon-circle colors fed to the module through the `--local-*` bridge,
 * projected from the shared tint/accent families (see ./tone) — the same
 * families Alert uses. Every value is a `var(--token)` reference, so each tone
 * stays brand-overridable.
 */
const TONES: Record<ToastTone, { tint: string; accent: string }> = {
  success: {
    tint: FEEDBACK_TONE_FAMILIES.success.tint,
    accent: FEEDBACK_TONE_FAMILIES.success.accent,
  },
  info: {
    tint: FEEDBACK_TONE_FAMILIES.info.tint,
    accent: FEEDBACK_TONE_FAMILIES.info.accent,
  },
  error: {
    tint: FEEDBACK_TONE_FAMILIES.error.tint,
    accent: FEEDBACK_TONE_FAMILIES.error.accent,
  },
};

/**
 * Compact toast — a surface pill with a tinted icon circle and one line of
 * text. Callers control auto-dismiss timing; this component only renders the
 * visual. Styling follows the co-located CSS module (see src/components/
 * STYLING.md): the per-tone icon-circle colors flow in as `--local-*` bridge
 * properties, everything else is a static token.
 */
export function Toast({ tone = 'success', children, style = {}, ...rest }: ToastProps) {
  const t = TONES[tone] ?? TONES.success;
  const bridge = {
    '--local-tint': t.tint,
    '--local-accent': t.accent,
  } as React.CSSProperties;

  return (
    <div
      role="status"
      aria-live="polite"
      className={styles.toast}
      style={{ ...bridge, ...style }}
      {...rest}
    >
      <div aria-hidden="true" className={styles.icon}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {FEEDBACK_TONE_ICONS[tone]}
        </svg>
      </div>
      <div className={styles.message}>{children}</div>
    </div>
  );
}
