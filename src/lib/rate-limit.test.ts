import { describe, expect, it } from 'vitest';

import { createRateLimiter } from './rate-limit';

/**
 * Sliding-window limiter behaviour. `now` is injected so the window logic is
 * tested deterministically without real timers.
 */
describe('createRateLimiter', () => {
  const LIMIT = 5;
  const WINDOW = 10 * 60 * 1000; // 10 minutes

  it('permits exactly `limit` events, then denies the next', () => {
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const now = 1_000_000;

    for (let i = 0; i < LIMIT; i += 1) {
      expect(limiter.check('ip-a', now + i).allowed).toBe(true);
    }

    const sixth = limiter.check('ip-a', now + LIMIT);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reports Retry-After as whole seconds until the oldest event ages out', () => {
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const start = 5_000_000;

    // Fill the window at t=start.
    for (let i = 0; i < LIMIT; i += 1) limiter.check('ip-b', start);

    // 1 minute later a 6th attempt is denied; the window frees 9 minutes out.
    const denied = limiter.check('ip-b', start + 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe((WINDOW - 60_000) / 1000); // 540s
  });

  it('permits again once the sliding window has fully passed', () => {
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const start = 9_000_000;

    for (let i = 0; i < LIMIT; i += 1) limiter.check('ip-c', start);
    expect(limiter.check('ip-c', start + 1).allowed).toBe(false);

    // Just past the window edge, the earliest events have expired.
    expect(limiter.check('ip-c', start + WINDOW + 1).allowed).toBe(true);
  });

  it('tracks each key independently', () => {
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const now = 2_000_000;

    for (let i = 0; i < LIMIT; i += 1) limiter.check('ip-x', now);
    expect(limiter.check('ip-x', now).allowed).toBe(false);
    // A different key is unaffected.
    expect(limiter.check('ip-y', now).allowed).toBe(true);
  });

  it('admits at most `limit` events under a burst at a single instant', () => {
    // Single-threaded JS makes each check-and-record atomic; under a same-tick
    // burst the limiter must still admit no more than `limit`.
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const now = 7_000_000;
    const results = Array.from({ length: 50 }, () => limiter.check('burst', now));
    const admitted = results.filter((r) => r.allowed).length;
    expect(admitted).toBe(LIMIT);
  });

  it('bounds retained keys at maxKeys under a flood of distinct keys (OOM guard)', () => {
    const limiter = createRateLimiter({
      limit: LIMIT,
      windowMs: WINDOW,
      maxKeys: 3,
    });
    const now = 8_000_000;

    // Mint far more distinct keys than the cap; memory must stay bounded.
    for (let i = 0; i < 1000; i += 1) {
      limiter.check(`key-${i}`, now);
    }
    expect(limiter.size()).toBe(3);
  });

  it('evicts the least-recently-used key, resetting its window on next touch', () => {
    const limiter = createRateLimiter({
      limit: LIMIT,
      windowMs: WINDOW,
      maxKeys: 2,
    });
    const now = 8_500_000;

    // Fill 'a' to the limit, then touch 'b' and 'c' so 'a' becomes the LRU key
    // and is evicted (cap is 2).
    for (let i = 0; i < LIMIT; i += 1) limiter.check('a', now);
    limiter.check('b', now);
    limiter.check('c', now);
    expect(limiter.size()).toBe(2);

    // 'a' was evicted → it starts a fresh window and is admitted again.
    expect(limiter.check('a', now).allowed).toBe(true);
  });

  it('does not accumulate empty buckets for keys whose events have all expired', () => {
    const limiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW });
    const start = 8_800_000;

    limiter.check('k', start);
    expect(limiter.size()).toBe(1);

    // Re-check well past the window: the expired timestamp is pruned and the key
    // is re-stored with exactly one fresh event — never an empty list.
    const res = limiter.check('k', start + WINDOW + 1);
    expect(res.allowed).toBe(true);
    expect(limiter.size()).toBe(1);
  });
});
