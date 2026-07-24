import { defaultLocale, isSupportedLocale, type SupportedLocale } from './locales';

/**
 * Resolve the storefront's active UI locale from the Magento `storeConfig`
 * store scope — NOT from the URL segment, a cookie, or a frontend-owned
 * enumeration. Magento's `storeConfig.locale` is a
 * Java-style locale tag (e.g. `en_US`); the frontend only needs the language
 * subtag, so this takes everything before the first `_`/`-` and lowercases it.
 *
 * Falls back to `defaultLocale` when the store's locale doesn't (yet) match a
 * language the frontend has a chrome catalog for (see `./chrome-copy.ts`) —
 * fail-closed to a real, fully-covered locale rather than rendering with a
 * missing catalog entry.
 */
export function resolveActiveLocale(storeConfigLocale: string): SupportedLocale {
  const subtag = storeConfigLocale.split(/[_-]/)[0]?.toLowerCase() ?? '';
  return isSupportedLocale(subtag) ? subtag : defaultLocale;
}
