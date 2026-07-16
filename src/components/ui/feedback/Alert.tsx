import React from 'react';

import styles from './Alert.module.css';

export type AlertTone = 'success' | 'info' | 'error';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** success (cta-tinted) · info (trust-tinted) · error (urgency-tinted — soft, never alarm red). */
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Show a dismiss control; banners persist until closed. */
  onClose?: () => void;
}

interface ToneColors {
  bg: string;
  border: string;
  accent: string;
  title: string;
  body: string;
}

/**
 * Per-tone color values fed to the module through the `--local-*` bridge. Every
 * value is a `var(--token)` reference, so each tone stays brand-overridable — no
 * raw color literal lives here or in the module. The tint/border/accent tokens
 * are the shared semantic families; the title/body inks are the dedicated
 * per-tone alert-ink tokens.
 */
const TONES: Record<AlertTone, ToneColors> = {
  success: {
    bg: 'var(--color-cta-tint)',
    border: 'var(--color-cta-tint-border)',
    accent: 'var(--color-cta)',
    title: 'var(--color-alert-success-title)',
    body: 'var(--color-alert-success-ink)',
  },
  info: {
    bg: 'var(--color-trust-tint)',
    border: 'var(--color-trust-tint-border)',
    accent: 'var(--color-trust)',
    title: 'var(--color-alert-info-title)',
    body: 'var(--color-alert-info-ink)',
  },
  error: {
    bg: 'var(--color-urgency-tint)',
    border: 'var(--color-urgency-tint-border)',
    accent: 'var(--color-urgency)',
    title: 'var(--color-alert-error-title)',
    body: 'var(--color-alert-error-ink)',
  },
};

const ICONS: Record<AlertTone, React.ReactNode> = {
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
 * Inline notification banner — tinted fill, accent bar, icon + text. Persists
 * until dismissed via `onClose`. Styling follows the co-located CSS module (see
 * src/components/STYLING.md): per-tone colors flow in exclusively as `--local-*`
 * bridge properties, consumed by the module and inherited by its descendants.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  onClose,
  style = {},
  ...rest
}: AlertProps) {
  const t = TONES[tone] ?? TONES.info;
  const bridge = {
    '--local-bg': t.bg,
    '--local-border': t.border,
    '--local-accent': t.accent,
    '--local-title-ink': t.title,
    '--local-body-ink': t.body,
    // White glyph on the tone's accent circle — the same on-fill role as the
    // Button CTA label; shared across every tone, so it is not per-tone.
    '--local-icon-stroke': 'var(--color-text-on-fill)',
  } as React.CSSProperties;

  return (
    <div role="status" className={styles.alert} style={{ ...bridge, ...style }} {...rest}>
      <div aria-hidden="true" className={styles.icon}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[tone]}
        </svg>
      </div>
      <div className={styles.body}>
        {title ? <div className={styles.title}>{title}</div> : null}
        {children ? (
          <div
            className={
              title ? `${styles.message} ${styles.messageSpaced}` : styles.message
            }
          >
            {children}
          </div>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className={styles.close}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
