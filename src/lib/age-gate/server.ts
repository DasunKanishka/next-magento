import 'server-only';

import { cookies } from 'next/headers';

import { COOKIE_NAME, isValidConsent } from './consent';

/**
 * Server-side gate check — reads and validates the age-gate consent cookie.
 *
 * Reads the first-party `nbns_gate` cookie from the ambient request via
 * `next/headers` and validates it. It is `async` because Next 16's `cookies()`
 * is async, and it reads from the App Router's request-scoped cookie store
 * rather than taking an explicit `Request` argument — the idiomatic
 * server-component form. Called from the locale layout to
 * decide whether to render the storefront or substitute the gate; reading a
 * cookie here makes the route dynamic, which is expected for a gated storefront.
 */
export async function hasConsented(): Promise<boolean> {
  const store = await cookies();
  return isValidConsent(store.get(COOKIE_NAME)?.value);
}
