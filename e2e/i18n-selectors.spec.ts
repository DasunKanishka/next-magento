import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Selecting any non-`nl` country/language combination resolves to the
 * `default`/EUR store content WITHOUT a runtime error. Asserted here against a
 * real browser (not assumed): a page-error listener fails the test on any
 * uncaught runtime error during the flow.
 *
 * The age/country gate now blocks every storefront route until consent exists,
 * so each test seeds a valid `nbns_gate` cookie first to reach the header
 * selectors under test.
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

test('default locale (nl) resolves to the default/EUR store view', async ({ page }) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');
  await expect(page.getByTestId('active-locale')).toHaveText('nl');
  await expect(page.getByTestId('resolved-store')).toHaveText('default');
  await expect(page.getByTestId('resolved-currency')).toHaveText('EUR');
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('a direct non-nl locale route falls back to default/EUR without a runtime error', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  const response = await page.goto('/de');
  expect(response, 'navigation returned a response').not.toBeNull();
  expect(response!.status(), 'status is not an error').toBeLessThan(400);
  await expect(page.getByTestId('active-locale')).toHaveText('de');
  await expect(page.getByTestId('resolved-store')).toHaveText('default');
  await expect(page.getByTestId('resolved-currency')).toHaveText('EUR');
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('selecting a non-nl language switches locale and stays on default/EUR', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');

  await page.getByRole('button', { name: /Taal: Nederlands/ }).click();
  await page.getByRole('menuitemradio', { name: /Frans/ }).click();

  await expect(page).toHaveURL(/\/fr(\/|$|\?)/);
  await expect(page.getByTestId('active-locale')).toHaveText('fr');
  await expect(page.getByTestId('resolved-store')).toHaveText('default');
  await expect(page.getByTestId('resolved-currency')).toHaveText('EUR');
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});

test('selecting a non-nl delivery country switches locale and stays on default/EUR', async ({
  page,
}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/nl');

  await page.getByRole('button', { name: /Bezorgland: Nederland/ }).click();
  await page.getByRole('menuitemradio', { name: 'Frankrijk' }).click();

  await expect(page).toHaveURL(/\/fr(\/|$|\?)/);
  await expect(page.getByTestId('resolved-store')).toHaveText('default');
  await expect(page.getByTestId('resolved-currency')).toHaveText('EUR');
  expect(errors, `runtime errors: ${errors.join(' | ')}`).toEqual([]);
});
