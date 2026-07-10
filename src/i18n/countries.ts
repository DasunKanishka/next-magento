import type { SupportedLocale } from './locales';

/**
 * ISO 3166-1 alpha-2 codes for the seeded delivery countries. The country a
 * visitor delivers to is orthogonal to the UI language (see `./languages.ts`):
 * this list drives the CountrySelector's left column and the age-gate grid.
 */
export type CountryCode = 'NL' | 'DE' | 'DK' | 'AT' | 'BE' | 'FR' | 'ES';

export interface Country {
  code: CountryCode;
  /** Display name, authored in the storefront's primary content language (nl). */
  name: string;
  /** The UI locale most natural for this country — used to pair a country pick with a sensible default language. */
  defaultLocale: SupportedLocale;
  /** Inline flag as an SVG data-URI (no external asset request), per design-spec. */
  flag: string;
}

/** Builds an SVG data-URI from a compact SVG body, URL-encoded for attribute-safe embedding. */
function flag(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const NL_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#21468B"/><rect width="9" height="4" fill="#fff"/><rect width="9" height="2" fill="#AE1C28"/></svg>',
);
const DE_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#FFCE00"/><rect width="9" height="4" fill="#DD0000"/><rect width="9" height="2" fill="#000"/></svg>',
);
const DK_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 28"><rect width="37" height="28" fill="#C8102E"/><rect x="12" width="4" height="28" fill="#fff"/><rect y="12" width="37" height="4" fill="#fff"/></svg>',
);
const AT_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#C8102E"/><rect y="2" width="9" height="2" fill="#fff"/></svg>',
);
const BE_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#EF3340"/><rect width="6" height="6" fill="#FDDA24"/><rect width="3" height="6" fill="#000"/></svg>',
);
const FR_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#EF4135"/><rect width="6" height="6" fill="#fff"/><rect width="3" height="6" fill="#0055A4"/></svg>',
);
const ES_FLAG = flag(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6"><rect width="9" height="6" fill="#AA151B"/><rect y="1.5" width="9" height="3" fill="#F1BF00"/></svg>',
);

/**
 * The 7 seeded delivery countries (PRD Design Decisions "Country/language
 * selector fallback"). All are selectable from day one; only `nl` resolves to
 * distinct real content in V0.1.0 (the rest fall back — see `./locale-resolver`).
 */
export const countries: readonly Country[] = [
  { code: 'NL', name: 'Nederland', defaultLocale: 'nl', flag: NL_FLAG },
  { code: 'DE', name: 'Duitsland', defaultLocale: 'de', flag: DE_FLAG },
  { code: 'DK', name: 'Denemarken', defaultLocale: 'da', flag: DK_FLAG },
  { code: 'AT', name: 'Oostenrijk', defaultLocale: 'de', flag: AT_FLAG },
  { code: 'BE', name: 'België', defaultLocale: 'nl', flag: BE_FLAG },
  { code: 'FR', name: 'Frankrijk', defaultLocale: 'fr', flag: FR_FLAG },
  { code: 'ES', name: 'Spanje', defaultLocale: 'es', flag: ES_FLAG },
];

/** The default delivery country when none has been chosen yet. */
export const defaultCountryCode: CountryCode = 'NL';

export function findCountry(code: CountryCode): Country | undefined {
  return countries.find((c) => c.code === code);
}
