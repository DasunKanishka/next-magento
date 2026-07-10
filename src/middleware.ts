import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

/**
 * next-intl locale middleware — negotiates the `[locale]` segment, redirects the
 * un-prefixed root to the default locale, and sets the locale cookie.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Match every path EXCEPT:
   *  - `api`      → BFF route handlers stay locale-agnostic (a locale prefix
   *                 would break `/api/bff/...`); the backend boundary is not an
   *                 i18n surface. This exclusion is load-bearing per AC#1.
   *  - `_next`    → Next.js build/runtime internals.
   *  - `_vercel`  → platform internals.
   *  - anything with a dot (`.*\\..*`) → static assets (favicon.ico, images,
   *                 fonts, etc.) served as-is, never locale-prefixed.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
