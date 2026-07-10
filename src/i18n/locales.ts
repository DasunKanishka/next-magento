/**
 * The supported locale set for the storefront.
 *
 * A "locale" here is the language dimension that drives both the `[locale]`
 * URL segment (via next-intl) and the message catalog. It is intentionally
 * separate from the delivery *country* (see `./countries.ts`): a visitor picks
 * a delivery country AND a UI language, and the two are orthogonal — Dutch can
 * be read while delivering to Belgium, English while delivering to Germany, etc.
 *
 * V0.1.0 backs exactly one locale (`nl`) with real Magento store-view content;
 * every other locale is a real, selectable UI language whose store resolution
 * falls back to the single `default`/EUR store view (see `./locale-resolver.ts`).
 * Adding real content for another locale in V0.2.0+ is a table entry, not a
 * code change here.
 */
export const supportedLocales = ['nl', 'en', 'fr', 'de', 'da', 'es'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

/** The locale served for the un-prefixed root and for any unresolved request. */
export const defaultLocale: SupportedLocale = 'nl';

/** Narrowing guard: is an arbitrary string one of the supported locales? */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(value);
}
