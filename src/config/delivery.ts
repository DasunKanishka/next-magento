import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';

/**
 * Free-shipping configuration + the cut-off-countdown math.
 *
 * The delivery-promise copy and its order cut-off hour are backend-sourced
 * content — `getStoreIdentity().deliveryPromise` (see
 * `src/lib/data-source/types.ts`) — NOT configured here. The header
 * components that render the promise/countdown receive the sourced `copy` +
 * `cutoffHour` as props and pass `cutoffHour` into `timeUntilCutoff` /
 * `deliveryCountdownLabel` below, which stay pure cut-off-hour-parametric
 * helpers with no store-identity value of their own. `deliveryCountdownLabel`'s
 * own WORDING (not the sourced copy) is store-locale chrome, resolved via
 * `src/i18n/chrome-copy.ts`.
 */

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
export function timeUntilCutoff(now: Date, cutoffHour: number): CutoffRemaining {
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
 * Right-aligned nav countdown label, e.g. "Today, 5h 42m left for delivery
 * tomorrow". After the cut-off it falls back to the plain next-day promise so
 * the line never shows a stale or negative countdown. `locale` resolves the
 * label's wording to the store locale (`src/i18n/chrome-copy.ts`).
 */
export function deliveryCountdownLabel(
  now: Date,
  cutoffHour: number,
  locale: SupportedLocale = defaultLocale,
): string {
  const remaining = timeUntilCutoff(now, cutoffHour);
  const cutoffLabel = `${String(cutoffHour).padStart(2, '0')}:00`;
  const copy = getChromeCopy(locale);
  if (remaining.past) {
    return copy.deliveryCountdownPastCutoff(cutoffLabel);
  }
  return copy.deliveryCountdownRemaining(remaining.hours, remaining.minutes);
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
