import { defineRouting } from 'next-intl/routing';

import { defaultLocale, supportedLocales } from './locales';

/**
 * next-intl routing definition — the single source of truth for the `[locale]`
 * URL segment. `locales`/`defaultLocale` come from `./locales.ts`, which
 * carries exactly the store view(s) the backend currently defines — today
 * that is one entry, `en` (the `249.magento.default` store's configured
 * language) — not a frontend-owned enumeration.
 * `localePrefix: 'always'` prefixes every locale, so the URL space is
 * uniform and unambiguous: `/en` today, `/en` plus one additive entry per
 * locale if a second store view is ever added. The middleware redirects the
 * un-prefixed root to the default locale.
 */
export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: 'always',
});
