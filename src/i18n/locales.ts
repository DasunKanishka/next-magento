/**
 * The supported locale set for the storefront.
 *
 * The active locale is a STORE-SCOPE property, resolved from Magento
 * `storeConfig.locale` (see `./resolve-locale.ts`), not a frontend-owned
 * enumeration. This list therefore carries exactly the locale(s) a real
 * backend store view currently defines — today that is one entry (`en`, the
 * `249.magento.default` store's configured language). It is intentionally
 * NOT a speculative multi-locale list "for the future": a new entry is added
 * only when the backend defines a new store view for it (an additive table
 * entry, not a code redesign).
 */
export const supportedLocales = ['en'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

/** The locale served for the un-prefixed root and for any unresolved request. */
export const defaultLocale: SupportedLocale = 'en';

/** Narrowing guard: is an arbitrary string one of the supported locales? */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(value);
}
