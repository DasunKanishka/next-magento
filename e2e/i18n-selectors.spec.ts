import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * The header country/language selectors keep the storefront rendering
 * without a runtime error, against the DE-SPECULATED locale model: the
 * active UI locale is a store-scope property — currently exactly one real
 * value (`en`, the
 * `249.magento.default` store's configured language) — not a frontend-owned
 * enumeration. Delivery country remains a real, independent business
 * dimension (7 seeded countries); picking one no longer changes the UI
 * locale, because no country here maps to a different backend store view.
 *
 * The age/country gate blocks every storefront route until consent exists, so
 * each test seeds a valid `nbns_gate` cookie first to reach the header.
 */

/** Seed consent before every storefront navigation so the gate does not block. */
test.beforeEach(async ({ context }) => {
  await seedConsent(context);
});

/** Attach a listener that records any uncaught runtime error on the page. */
function trackRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('the default (and only) locale renders the storefront without a runtime error', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/en');
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('a locale the backend has no store view for 404s rather than rendering (no speculative locale apparatus)', async ({
  page,
}) => {
  const response = await page.goto('/de');
  expect(response, 'navigation returned a response').not.toBeNull();
  expect(response!.status()).toBe(404);
  await expect(page.getByTestId('home-page')).toHaveCount(0);
});

test('selecting the (only) supported language keeps the storefront rendering on the same locale', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/en');

  // The header exposes country and language in one dropdown; pick the
  // language column's sole option.
  await page.getByRole('button', { name: /Delivery country: Netherlands/ }).click();
  await page.getByRole('menuitemradio', { name: /English/ }).click();

  await expect(page).toHaveURL(/\/en(\/|$|\?)/);
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('selecting a non-default delivery country keeps rendering on the same locale (country and UI language are decoupled)', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/en');

  await page.getByRole('button', { name: /Delivery country: Netherlands/ }).click();
  await page.getByRole('menuitemradio', { name: 'France' }).click();

  // Every seeded country resolves to the single real store view today, so
  // picking a different delivery country does not change the UI locale/URL —
  // that would be exactly the phantom per-country-locale apparatus V0.1.4
  // removed.
  await expect(page).toHaveURL(/\/en(\/|$|\?)/);
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});
