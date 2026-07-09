import 'server-only';

import { getDataSource, type StoreConfig } from './index';

/**
 * Request-scoped store context.
 *
 * `currency` is NEVER pinned in code or env — it is resolved from the store
 * SCOPE by reading `getStoreConfig({ storeCode }).currencyCode` once per
 * request. This is the value threaded back as the explicit `Content-Currency`
 * header on every subsequent scope-bound backend call, so cache keys stay
 * correct (`Store` + `Content-Currency`) even as store views multiply.
 */
export interface StoreContext {
  storeCode: string;
  currency: string;
  storeConfig: StoreConfig;
}

/**
 * Store config is deploy-static per store view (the scope's currency, locale
 * and media base do not change at request cadence), so the resolved context is
 * memoized per `storeCode` to drop the extra backend round-trip on every
 * request. A short TTL bounds staleness after an admin-side config change. The
 * cache is server-only (this module is `server-only`) and holds only canonical
 * config values — no token or credential.
 */
const STORE_CONTEXT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: StoreContext;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Clear the memoized store-context cache. Useful to force a refresh after a
 * store-config change, and to isolate tests. Server-only.
 */
export function clearStoreContextCache(): void {
  cache.clear();
}

/**
 * Resolve the store context for the current request.
 *
 * `storeCode` defaults to the deploy-time `MAGENTO_STORE_CODE` (the store view
 * this instance serves); it is server-only config, never a client value. The
 * currency is taken from the resolved store config — the scope's own currency,
 * not a configured or defaulted one. Resolutions are memoized per `storeCode`
 * (see the cache note above).
 */
export async function resolveStoreContext(
  args: { storeCode?: string } = {},
): Promise<StoreContext> {
  const storeCode = args.storeCode ?? process.env.MAGENTO_STORE_CODE ?? 'default';

  const now = Date.now();
  const cached = cache.get(storeCode);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const storeConfig = await getDataSource().getStoreConfig({ storeCode });
  const value: StoreContext = {
    // Prefer the scope's own reported store code; fall back to the requested
    // one if the backend returns an empty value.
    storeCode: storeConfig.storeCode || storeCode,
    currency: storeConfig.currencyCode,
    storeConfig,
  };

  cache.set(storeCode, { value, expiresAt: now + STORE_CONTEXT_TTL_MS });
  return value;
}
