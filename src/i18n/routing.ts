import { defineRouting } from 'next-intl/routing';

import { defaultLocale, supportedLocales } from './locales';

/**
 * next-intl routing definition — the single source of truth for the `[locale]`
 * URL segment. `localePrefix: 'always'` prefixes every locale (including the
 * default `nl`), so the URL space is uniform and unambiguous: `/nl`, `/en`,
 * `/fr`, … The middleware redirects the un-prefixed root to the default locale.
 */
export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: 'always',
});
