import type { SupportedLocale } from './locales';

/**
 * Locale-correct delivery-country and UI-language display names, resolved
 * from the platform `Intl.DisplayNames` API — never a hardcoded name table
 * (no frontend-owned locale artifact). `isoCode`/
 * `languageCode` are the country's ISO 3166-1 alpha-2 code and the
 * language's BCP-47 subtag respectively — both already carried as data on
 * `Country.code` (`./countries.ts`) and `Language.locale` (`./languages.ts`),
 * so no new ISO-code field was needed.
 *
 * Both resolve names IN THE ACTIVE STORE LOCALE, not the entry's own
 * language: on the current English store every name (country or language)
 * renders in English, exactly as it would for any other resolved locale a
 * future store view defines — the store's locale governs, not the entry.
 *
 * `Intl.DisplayNames.prototype.of()` can throw for a malformed subtag; both
 * helpers fail closed to the raw code (never blank, never a crash) rather
 * than assume any specific fallback text.
 */

export function countryDisplayName(locale: SupportedLocale, isoCode: string): string {
  try {
    return new Intl.DisplayNames(locale, { type: 'region' }).of(isoCode) ?? isoCode;
  } catch {
    return isoCode;
  }
}

export function languageDisplayName(
  locale: SupportedLocale,
  languageCode: string,
): string {
  try {
    return (
      new Intl.DisplayNames(locale, { type: 'language' }).of(languageCode) ?? languageCode
    );
  } catch {
    return languageCode;
  }
}
