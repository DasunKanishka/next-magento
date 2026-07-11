'use client';

import React from 'react';

import { deliveryCountdownLabel, DELIVERY_DEADLINE_COPY } from '@/config/delivery';

export interface DeliveryCountdownProps {
  /** Optional style hook for the containing element. */
  style?: React.CSSProperties;
}

/**
 * Right-aligned live delivery-urgency line, counting down to the order cut-off
 * against the same fixed deadline the trust copy promises. The live value is
 * computed only after mount (client clock) — before that it shows the static
 * next-day promise, so the server-rendered HTML and the first client paint
 * agree and there is no hydration mismatch.
 */
export function DeliveryCountdown({ style = {} }: DeliveryCountdownProps) {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tick = () => setLabel(deliveryCountdownLabel(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        font: '600 13px/1 var(--font-brand)',
        color: 'var(--color-urgency)',
        ...style,
      }}
    >
      <span aria-hidden="true">⚡</span>
      {label ?? DELIVERY_DEADLINE_COPY}
    </span>
  );
}
