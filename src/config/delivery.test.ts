import { describe, expect, it } from 'vitest';

import {
  deliveryCountdownLabel,
  freeShippingProgressPct,
  freeShippingRemaining,
  FREE_SHIPPING_THRESHOLD_EUR,
  ORDER_CUTOFF_HOUR,
  timeUntilCutoff,
} from './delivery';

describe('timeUntilCutoff', () => {
  it('returns the remaining hours and minutes before the cut-off', () => {
    const now = new Date(2026, 6, 10, 16, 18, 0);
    const r = timeUntilCutoff(now, ORDER_CUTOFF_HOUR);
    expect(r.past).toBe(false);
    expect(r.hours).toBe(5);
    expect(r.minutes).toBe(42);
  });

  it('reports past once the cut-off has elapsed', () => {
    const now = new Date(2026, 6, 10, 22, 30, 0);
    const r = timeUntilCutoff(now, ORDER_CUTOFF_HOUR);
    expect(r.past).toBe(true);
    expect(r.hours).toBe(0);
    expect(r.minutes).toBe(0);
  });
});

describe('deliveryCountdownLabel', () => {
  it('formats a live countdown before the cut-off', () => {
    const now = new Date(2026, 6, 10, 16, 18, 0);
    expect(deliveryCountdownLabel(now)).toBe('Vandaag nog 5u 42m voor levering morgen');
  });

  it('falls back to the plain promise after the cut-off', () => {
    const now = new Date(2026, 6, 10, 23, 0, 0);
    expect(deliveryCountdownLabel(now)).toBe('Bestel voor 22:00 voor levering morgen');
  });
});

describe('free-shipping helpers', () => {
  it('computes the remaining amount and clamps at zero', () => {
    expect(freeShippingRemaining(0)).toBe(FREE_SHIPPING_THRESHOLD_EUR);
    expect(freeShippingRemaining(FREE_SHIPPING_THRESHOLD_EUR + 20)).toBe(0);
  });

  it('computes a clamped 0–100 progress percentage', () => {
    expect(freeShippingProgressPct(0)).toBe(0);
    expect(freeShippingProgressPct(FREE_SHIPPING_THRESHOLD_EUR / 2)).toBe(50);
    expect(freeShippingProgressPct(FREE_SHIPPING_THRESHOLD_EUR * 2)).toBe(100);
  });
});
