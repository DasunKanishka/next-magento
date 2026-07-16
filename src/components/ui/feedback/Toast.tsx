import React from 'react';

import styles from './Toast.module.css';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ToastTone;
  children?: React.ReactNode;
}

/**
 * Per-tone icon-circle colors fed to the module through the `--local-*` bridge.
 * Every value is a `var(--token)` reference (the same tint/accent families
 * Alert uses), so each tone stays brand-overridable.
 */
const TONES: Record<ToastTone, { tint: string; accent: string }> = {
  success: { tint: 'var(--color-cta-tint)', accent: 'var(--color-cta)' },
  info: { tint: 'var(--color-trust-tint)', accent: 'var(--color-trust)' },
  error: { tint: 'var(--color-urgency-tint)', accent: 'var(--color-urgency)' },
};

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <polyline points="20 6 9 17 4 12" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </>
  ),
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
          {ICONS[tone]}
        </svg>
      </div>
      <div className={styles.message}>{children}</div>
    </div>
  );
}
