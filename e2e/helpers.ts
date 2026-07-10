import type { BrowserContext } from '@playwright/test';

/**
 * Builds a valid `nbns_gate` consent cookie value, mirroring the server's
 * `serializeConsent` (base64url of the JSON attestation payload). Used by
 * storefront E2E specs to seed consent so they can reach the gated pages —
 * the age/country gate now blocks every storefront route until consent exists.
 */
export function consentCookieValue(country = 'NL'): string {
  const payload = JSON.stringify({ country, ageConfirmed: true, ts: Date.now() });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

/** Seeds a valid consent cookie into a browser context so the storefront renders. */
export async function seedConsent(
  context: BrowserContext,
  baseURL = 'http://localhost:3000',
): Promise<void> {
  await context.addCookies([
    { name: 'nbns_gate', value: consentCookieValue(), url: baseURL },
  ]);
}
