import type { SupportedLocale } from './locales';

/**
 * ISO 3166-1 alpha-2 codes for the seeded delivery countries. The country a
 * visitor delivers to is orthogonal to the UI language (see `./languages.ts`):
 * this list drives the CountrySelector's left column and the age-gate grid.
 */
export type CountryCode = 'NL' | 'DE' | 'DK' | 'AT' | 'BE' | 'FR' | 'ES';

export interface Country {
  /** ISO 3166-1 alpha-2 code — also the key `countryDisplayName` (`./display-names.ts`) resolves a locale-correct display name from. No separate display-name field: a hardcoded name here would be exactly the frontend-owned locale artifact this project forbids. */
  code: CountryCode;
  /** The UI locale most natural for this country — used to pair a country pick with a sensible default language. */
  defaultLocale: SupportedLocale;
  /** Inline flag as an SVG data-URI (no external asset request). */
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
 * The 7 seeded delivery countries — a real, orthogonal business dimension
 * (see the module doc comment above), independent of the UI locale. All
 * remain selectable: delivery country and UI language are not coupled to the
 * same backend concept, so de-speculating the locale model (see
 * `./languages.ts`) does not remove any of them. Every country's
 * `defaultLocale` now points at the single real store view (`en`); previously
 * each pointed at a distinct phantom locale with no corresponding store view.
 * Display names are NOT data here — see `Country.code`'s own comment.
 */
export const countries: readonly Country[] = [
  { code: 'NL', defaultLocale: 'en', flag: NL_FLAG },
  { code: 'DE', defaultLocale: 'en', flag: DE_FLAG },
  { code: 'DK', defaultLocale: 'en', flag: DK_FLAG },
  { code: 'AT', defaultLocale: 'en', flag: AT_FLAG },
  { code: 'BE', defaultLocale: 'en', flag: BE_FLAG },
  { code: 'FR', defaultLocale: 'en', flag: FR_FLAG },
  { code: 'ES', defaultLocale: 'en', flag: ES_FLAG },
];

/** The default delivery country when none has been chosen yet. */
export const defaultCountryCode: CountryCode = 'NL';

export function findCountry(code: CountryCode): Country | undefined {
  return countries.find((c) => c.code === code);
}
