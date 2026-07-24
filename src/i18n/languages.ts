import type { SupportedLocale } from './locales';

/** 2-letter display code shown in the selector's language code-chip. */
export type LanguageCode = 'EN';

export interface Language {
  /** Uppercase 2-letter chip code shown in the selector. */
  code: LanguageCode;
  /**
   * The BCP-47 subtag this language maps to — also the key
   * `languageDisplayName` (`./display-names.ts`) resolves a locale-correct
   * display name from. No separate display-name field: a hardcoded name here
   * would be exactly the frontend-owned locale artifact this project forbids.
   */
  locale: SupportedLocale;
}

/**
 * The UI languages shown in the LanguageSelector.
 *
 * The UI language tracks the backend's store views, not a frontend-owned
 * wishlist — this list has exactly as many entries as `SupportedLocale`
 * (`./locales.ts`), which today is the single `249.magento.default` store
 * view (English). Adding a language is a table entry made alongside a new
 * `SupportedLocale` value, once the backend defines the store view for it.
 * Display names are NOT data here — see `Language.locale`'s own comment.
 */
export const languages: readonly Language[] = [{ code: 'EN', locale: 'en' }];

/** The default active language, matching the default locale. */
export const defaultLanguageCode: LanguageCode = 'EN';

export function findLanguageByLocale(locale: SupportedLocale): Language | undefined {
  return languages.find((l) => l.locale === locale);
}
