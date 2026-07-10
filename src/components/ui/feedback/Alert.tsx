import React from 'react';

export type AlertTone = 'success' | 'info' | 'error';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** success (cta-tinted) · info (trust-tinted) · error (urgency-tinted — soft, never alarm red). */
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Show a dismiss control; banners persist until closed. */
  onClose?: () => void;
}

/**
 * Role-mapping object: assigns each tone to its contract tint tokens plus
 * `title`/`body` ink colors. The design spec's component-to-token mapping
 * for Alert names only the tint/border/accent tokens + `--font-brand` — it
 * does not name a contract token for the title/body text inks, so those
 * stay literal here (inside this role-map), matching the delivered design.
 */
const TONES: Record<
  AlertTone,
  { bg: string; border: string; accent: string; title: string; body: string; iconStroke: string }
> = {
  success: {
    bg: 'var(--color-cta-tint)',
    border: 'var(--color-cta-tint-border)',
    accent: 'var(--color-cta)',
    title: '#146B40',
    body: '#3E6B54',
    iconStroke: '#fff',
  },
  info: {
    bg: 'var(--color-trust-tint)',
    border: 'var(--color-trust-tint-border)',
    accent: 'var(--color-trust)',
    title: 'var(--color-trust-ink)',
    body: '#3B6469',
    iconStroke: '#fff',
  },
  error: {
    bg: 'var(--color-urgency-tint)',
    border: 'var(--color-urgency-tint-border)',
    accent: 'var(--color-urgency)',
    title: '#8E2A40',
    body: '#7A3A48',
    iconStroke: '#fff',
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
 * Inline notification banner — tinted fill, 4px accent bar, icon + text.
 * Persists until dismissed via `onClose`.
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
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderLeft: `4px solid ${t.accent}`,
        borderRadius: 12,
        padding: '16px 18px',
        ...style,
      }}
      {...rest}
    >
      <div
        aria-hidden="true"
        style={{
          flex: '0 0 auto',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: t.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={t.iconStroke}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[tone]}
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        {title ? (
          <div style={{ font: '700 14px/1.3 var(--font-brand)', color: t.title }}>{title}</div>
        ) : null}
        {children ? (
          <div
            style={{
              font: '400 13px/1.55 var(--font-brand)',
              color: t.body,
              marginTop: title ? 3 : 0,
            }}
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
          style={{
            flex: '0 0 auto',
            background: 'none',
            border: 'none',
            color: t.accent,
            opacity: 0.5,
            cursor: 'pointer',
            padding: 2,
          }}
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
