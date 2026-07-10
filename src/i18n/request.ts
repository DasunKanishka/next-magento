import { getRequestConfig } from 'next-intl/server';

import { isSupportedLocale } from './locales';
import { routing } from './routing';

/**
 * Per-request i18n configuration consumed by next-intl's server integration
 * (wired via the `createNextIntlPlugin` call in `next.config.ts`, which resolves
 * this file at `src/i18n/request.ts` by convention).
 *
 * The incoming `requestLocale` comes from the matched `[locale]` segment; if it
 * is missing or not a supported locale we fail closed to the default locale
 * rather than attempting to load a non-existent catalog.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isSupportedLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
