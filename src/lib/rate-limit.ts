/**
 * Sliding-window, per-key rate limiter.
 *
 * ⚠️ IN-MEMORY & PER-INSTANCE. The window state lives in a `Map` in this
 * process's heap. It is correct for a single running instance (single-threaded
 * JS makes the check-and-record atomic), but it does NOT coordinate across
 * multiple instances / replicas: behind a load balancer each instance keeps its
 * own counters, so the effective global limit is `limit × instanceCount`. A
 * multi-instance deployment MUST replace this with a shared store (e.g. a
 * central key/value store with atomic increments) — the interface here is
 * intentionally small so that swap is a drop-in.
 *
 * Memory is bounded two ways so a flood of DISTINCT keys cannot grow the heap
 * without limit (an OOM vector): (1) a checked key's timestamp list is always
 * re-stored non-empty, so no empty buckets accumulate; (2) the total number of
 * retained keys is capped at `maxKeys`, evicting the least-recently-used key
 * once the cap is exceeded (Map iteration order = insertion order, and every
 * check re-inserts its key last, so the first key is the LRU one).
 */

/** Default ceiling on retained distinct keys — bounds worst-case memory. */
export const DEFAULT_MAX_KEYS = 10_000;

export interface RateLimitResult {
  /** Whether this request is permitted under the window. */
  allowed: boolean;
  /**
   * Seconds until the window frees enough to permit the next request. `0` when
   * allowed. Suitable as a `Retry-After` header value when denied.
   */
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  /** Max permitted events per key within the window. */
  limit: number;
  /** Sliding-window width in milliseconds. */
  windowMs: number;
  /**
   * Ceiling on retained distinct keys. Once exceeded, the least-recently-used
   * key is evicted so total memory stays bounded regardless of key cardinality.
   * Defaults to {@link DEFAULT_MAX_KEYS}.
   */
  maxKeys?: number;
}

export interface RateLimiter {
  /**
   * Record an attempt for `key` and report whether it is permitted. Pass `now`
   * (epoch ms) only in tests; production omits it and uses `Date.now()`.
   */
  check(key: string, now?: number): RateLimitResult;
  /** Current count of retained keys — for observability and memory-bound tests. */
  size(): number;
}

/**
 * Create an isolated sliding-window rate limiter. Each limiter owns its own
 * `Map`, so callers can construct independent limiters without shared state.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs } = options;
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  // key → ascending list of accepted event timestamps still within the window.
  const hits = new Map<string, number[]>();

  function evictLeastRecentlyUsed(): void {
    // The first key in insertion order is the least-recently-touched (every
    // check re-inserts its key last). Evict from the front until within cap.
    while (hits.size > maxKeys) {
      const lruKey = hits.keys().next().value;
      if (lruKey === undefined) break;
      hits.delete(lruKey);
    }
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((ts) => ts > windowStart);

      // Touch for LRU: remove first so the re-insert below places this key last
      // in iteration order. This also means a key is only ever re-stored with a
      // non-empty list (see both branches), so empty buckets never accumulate.
      hits.delete(key);

      if (recent.length >= limit) {
        // Denied: the window frees once its oldest event ages out.
        const oldest = recent[0];
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((oldest + windowMs - now) / 1000),
        );
        hits.set(key, recent);
        evictLeastRecentlyUsed();
        return { allowed: false, retryAfterSeconds };
      }

      recent.push(now);
      hits.set(key, recent);
      evictLeastRecentlyUsed();
      return { allowed: true, retryAfterSeconds: 0 };
    },

    size(): number {
      return hits.size;
    },
  };
}
