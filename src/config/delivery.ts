/**
 * Delivery-promise + free-shipping configuration.
 *
 * These values back three surfaces that must stay in lockstep: the trust
 * micro-copy under the search bar, the desktop delivery-urgency countdown, and
 * the mobile utility strip. The single deadline string is defined ONCE here so
 * every surface renders the identical promise — there is no per-surface copy
 * and no separate config schema in this version (global, environment-scoped,
 * not per-country).
 */

/** Order cut-off hour (24h, store-local). Orders placed before this ship for next-day delivery. */
export const ORDER_CUTOFF_HOUR = 22;

/**
 * The single unified delivery-promise string, shown identically on every
 * surface that carries it (search trust line, mobile utility strip, and the
 * source of truth the countdown counts down to).
 */
export const DELIVERY_DEADLINE_COPY = 'Voor 22:00 besteld, morgen in huis';

/** Free-shipping threshold in EUR. */
export const FREE_SHIPPING_THRESHOLD_EUR = 150;

/** Aggregate review signal shown alongside the delivery promise. */
export const REVIEW_RATING_COPY = '4.8 — 12.000+ reviews';

export interface CutoffRemaining {
  hours: number;
  minutes: number;
  /** True when the cut-off for the current day has already passed. */
  past: boolean;
}

/**
 * Time left until today's order cut-off. Pure and deterministic — takes the
 * reference instant explicitly so it is unit-testable without mocking the
 * clock. Once the cut-off has passed, returns `{ past: true }` with a zero
 * remainder rather than a negative duration.
 */
export function timeUntilCutoff(
  now: Date,
  cutoffHour: number = ORDER_CUTOFF_HOUR,
): CutoffRemaining {
  const cutoff = new Date(now);
  cutoff.setHours(cutoffHour, 0, 0, 0);
  const diffMs = cutoff.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, past: true };
  }
  const totalMinutes = Math.floor(diffMs / 60_000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    past: false,
  };
}

/**
 * Right-aligned nav countdown label, e.g. "Vandaag nog 5u 42m voor levering
 * morgen". After the cut-off it falls back to the plain next-day promise so the
 * line never shows a stale or negative countdown.
 */
export function deliveryCountdownLabel(
  now: Date,
  cutoffHour: number = ORDER_CUTOFF_HOUR,
): string {
  const remaining = timeUntilCutoff(now, cutoffHour);
  const cutoffLabel = `${String(cutoffHour).padStart(2, '0')}:00`;
  if (remaining.past) {
    return `Bestel voor ${cutoffLabel} voor levering morgen`;
  }
  return `Vandaag nog ${remaining.hours}u ${remaining.minutes}m voor levering morgen`;
}

/** Amount (EUR) still needed to reach the free-shipping threshold. */
export function freeShippingRemaining(cartTotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_EUR - cartTotal);
}

/** Progress toward the free-shipping threshold, clamped to 0–100. */
export function freeShippingProgressPct(cartTotal: number): number {
  if (FREE_SHIPPING_THRESHOLD_EUR <= 0) return 100;
  return Math.min(
    100,
    Math.max(0, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD_EUR) * 100)),
  );
}
