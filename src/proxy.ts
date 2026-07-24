import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

/**
 * next-intl locale proxy (Next 16 `proxy` file convention — formerly
 * `middleware`; functionally identical, see
 * https://nextjs.org/docs/messages/middleware-to-proxy). Negotiates the
 * `[locale]` segment, redirects the un-prefixed root to the default locale,
 * and sets the locale cookie. `createMiddleware()` is next-intl's factory
 * name (next-intl 4.13 has not renamed its export); the function it returns
 * is a plain `(NextRequest) => NextResponse | undefined`, exactly the
 * signature Next 16's Proxy convention expects — no signature change is
 * needed for the file-convention rename, and Next.js accepts either a
 * default export or a named `proxy` export (default export used here).
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
