import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * The header country/language selectors switch the active locale without a
 * runtime error, and the storefront keeps rendering afterwards. Asserted
 * against a real browser (not assumed): a page-error listener fails the test on
 * any uncaught runtime error during the flow.
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

test('the default locale renders the storefront without a runtime error', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('a direct non-default locale route still renders without a runtime error', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  const response = await page.goto('/de');
  expect(response, 'navigation returned a response').not.toBeNull();
  expect(response!.status(), 'status is not an error').toBeLessThan(400);
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('selecting a non-default language switches locale and keeps rendering', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');

  // The header exposes country and language in one dropdown; pick the language.
  await page.getByRole('button', { name: /Bezorgland: Nederland/ }).click();
  await page.getByRole('menuitemradio', { name: /Frans/ }).click();

  await expect(page).toHaveURL(/\/fr(\/|$|\?)/);
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('selecting a non-default delivery country switches locale and keeps rendering', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');

  await page.getByRole('button', { name: /Bezorgland: Nederland/ }).click();
  await page.getByRole('menuitemradio', { name: 'Frankrijk' }).click();

  await expect(page).toHaveURL(/\/fr(\/|$|\?)/);
  await expect(page.getByTestId('home-page')).toBeVisible();
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});
