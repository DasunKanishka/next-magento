import React from 'react';

export interface DeliveryNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  /** Countdown to the same-day order deadline, e.g. "5u 42m". Omit/null to hide. */
  countdown?: string | null;
  /** Free-shipping threshold line. */
  threshold?: string;
  style?: React.CSSProperties;
}

/**
 * The default `title` is the authoritative phrasing "Voor 22:00 besteld, morgen
 * in huis" — deliberately NOT the source mockup's default "Besteld vóór 22:00,
 * morgen in huis", which is off-spec and intentionally not reproduced here.
 */
const DEFAULT_TITLE = 'Voor 22:00 besteld, morgen in huis';

/** Blue delivery-reassurance block for the buy box (deadline + countdown). */
export function DeliveryNote({
  title = DEFAULT_TITLE,
  countdown = '5u 42m',
  threshold = 'Gratis vanaf €150',
  style = {},
  ...rest
}: DeliveryNoteProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        padding: '13px 15px',
        background: 'var(--color-info)',
        border: '1px solid var(--color-info-border)',
        borderRadius: 10,
        ...style,
      }}
      {...rest}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flex: '0 0 auto', marginTop: 1 }}
      >
        <rect x="1" y="3" width="15" height="13" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <div>
        <div
          style={{ font: '600 14px/1.3 var(--font-brand)', color: 'var(--color-brand)' }}
        >
          {title}
        </div>
        <div
          style={{
            font: '500 12px/1.4 var(--font-brand)',
            color: 'var(--color-info-ink)',
            marginTop: 3,
          }}
        >
          {countdown ? (
            <>
              Nog <strong>{countdown}</strong> om vandaag te bestellen ·{' '}
            </>
          ) : null}
          {threshold}
        </div>
      </div>
    </div>
  );
}
