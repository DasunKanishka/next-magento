'use client';

import React from 'react';

import { deliveryCountdownLabel } from '@/config/delivery';
import styles from './DeliveryCountdown.module.css';

export interface DeliveryCountdownProps {
  /** Backend-sourced delivery-promise copy (`identity.deliveryPromise.copy`) — shown before mount and as the post-cut-off fallback wording's source deadline. */
  copy: string;
  /** Backend-sourced order cut-off hour (`identity.deliveryPromise.cutoffHour`). */
  cutoffHour: number;
  /** Optional style hook for the containing element. */
  style?: React.CSSProperties;
}

/**
 * Right-aligned live delivery-urgency line, counting down to the order cut-off
 * against the same backend-sourced deadline the trust copy promises. The live
 * value is computed only after mount (client clock) — before that it shows the
 * static next-day promise, so the server-rendered HTML and the first client
 * paint agree and there is no hydration mismatch.
 */
export function DeliveryCountdown({
  copy,
  cutoffHour,
  style = {},
}: DeliveryCountdownProps) {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tick = () => setLabel(deliveryCountdownLabel(new Date(), cutoffHour));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [cutoffHour]);

  return (
    <span aria-live="polite" className={styles.countdown} style={style}>
      <span aria-hidden="true">⚡</span>
      {label ?? copy}
    </span>
  );
}
