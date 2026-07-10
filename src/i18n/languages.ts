import type { SupportedLocale } from './locales';

/** 2-letter display code shown in the selector's language code-chip. */
export type LanguageCode = 'EN' | 'NL' | 'FR' | 'DE' | 'DA' | 'ES';

export interface Language {
  /** Uppercase 2-letter chip code (design-spec "2-letter code chip"). */
  code: LanguageCode;
  /** The routing/message locale this language maps to. */
  locale: SupportedLocale;
  /** Display name, authored in the storefront's primary content language (nl). */
  name: string;
}

/**
 * The 6 seeded UI languages (design-spec "LanguageSelector"; PRD Design
 * Decisions). Order matches the design-spec seed list. Every language is a real,
 * selectable option; the store-view/currency each resolves to is governed by
 * `./locale-resolver.ts` (only `nl` has distinct real content in V0.1.0).
 */
export const languages: readonly Language[] = [
  { code: 'EN', locale: 'en', name: 'Engels' },
  { code: 'NL', locale: 'nl', name: 'Nederlands' },
  { code: 'FR', locale: 'fr', name: 'Frans' },
  { code: 'DE', locale: 'de', name: 'Duits' },
  { code: 'DA', locale: 'da', name: 'Deens' },
  { code: 'ES', locale: 'es', name: 'Spaans' },
];

/** The default active language (Nederlands), matching the default locale. */
export const defaultLanguageCode: LanguageCode = 'NL';

export function findLanguageByLocale(locale: SupportedLocale): Language | undefined {
  return languages.find((l) => l.locale === locale);
}
