import React from 'react';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ToastTone;
  children?: React.ReactNode;
}

/**
 * Role-mapping object: shares its tint/accent tokens with `Alert`'s `TONES`
 * map (same contract keys, no independent literals besides token names).
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
 * Compact toast — a white pill with a tinted icon circle and one line of
 * text. Callers control auto-dismiss timing (~4s per the design spec);
 * this component only renders the visual — no timer is baked in here since
 * that belongs to whatever toast-queue/host manages multiple instances.
 */
export function Toast({ tone = 'success', children, style = {}, ...rest }: ToastProps) {
  const t = TONES[tone] ?? TONES.success;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 11,
        background: '#fff',
        border: '1px solid var(--color-border-card)',
        borderRadius: 12,
        padding: '13px 15px',
        boxShadow: 'var(--shadow-raised)',
        ...style,
      }}
      {...rest}
    >
      <div
        aria-hidden="true"
        style={{
          flex: '0 0 auto',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: t.tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={t.accent}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[tone]}
        </svg>
      </div>
      <div
        style={{
          font: '600 13px/1.35 var(--font-brand)',
          color: 'var(--color-brand-ink)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
