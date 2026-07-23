import { getRequestConfig } from 'next-intl/server';

import { isSupportedLocale } from './locales';
import { routing } from './routing';

/**
 * Per-request i18n configuration consumed by next-intl's server integration
 * (wired via the `createNextIntlPlugin` call in `next.config.ts`, which resolves
 * this file at `src/i18n/request.ts` by convention).
 *
 * The incoming `requestLocale` comes from the matched `[locale]` segment; if it
 * is missing or not a supported locale we fail closed to the default locale.
 *
 * `messages` is always `{}`: the former `messages/*.json` catalogs were dead
 * (nothing called next-intl's `useTranslations`/`getTranslations`). Every
 * UI-chrome literal in scope now resolves via the store-locale catalog in
 * `./chrome-copy.ts`, keyed
 * directly off the locale resolved from `storeConfig` (`./resolve-locale.ts`).
 * next-intl is retained here only for the `[locale]` URL segment negotiation
 * and its locale-aware navigation primitives (`./navigation.ts`), which need
 * a resolved locale in scope but no message content.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isSupportedLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: {},
  };
});
