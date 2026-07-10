import { expect, test } from '@playwright/test';

/**
 * Age/country gate E2E — server-side alcohol-compliance enforcement.
 *
 * These specs use fresh browser contexts with NO `nbns_gate` cookie, so the
 * gate is in force. The gate title is the stable marker for "gate is showing";
 * the home page's `resolved-store` testid is the stable marker for "storefront
 * is showing" — its absence proves the underlying page was not rendered.
 */

const GATE_TITLE = 'Waar mogen we naartoe bezorgen?';

test('MUST-3: with client JS disabled and no consent cookie, the gate renders and NO storefront content is sent (AC#2)', async ({
  browser,
}) => {
  // Client JS disabled: a client-only scrim would be bypassable here — server
  // render substitution is the only thing that can pass this test.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  const response = await page.goto('/nl');
  expect(response, 'navigation returned a response').not.toBeNull();
  expect(response!.status(), 'status is not an error').toBeLessThan(400);

  // The gate is present...
  await expect(page.getByRole('heading', { name: GATE_TITLE })).toBeVisible();
  await expect(
    page.getByText(
      'Geen verkoop van alcohol onder de 18 jaar · Geniet, maar drink met mate',
    ),
  ).toBeVisible();

  // ...and the storefront page (its product/price/store content) is NOT.
  await expect(page.getByTestId('resolved-store')).toHaveCount(0);
  await expect(page.getByTestId('resolved-currency')).toHaveCount(0);

  // Belt-and-braces: assert against the raw response HTML too, so this holds
  // even independent of client-side hydration.
  const html = await response!.text();
  expect(html).toContain(GATE_TITLE);
  expect(html).not.toContain('data-testid="resolved-store"');

  await context.close();
});

test('full flow: blocked → select country → confirm 18+ → CTA enables → enter → cookie persists across reload (AC#6)', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/nl');

  // Blocked: gate visible, storefront absent.
  await expect(page.getByRole('heading', { name: GATE_TITLE })).toBeVisible();
  await expect(page.getByTestId('resolved-store')).toHaveCount(0);

  const cta = page.getByRole('button', { name: /De winkel betreden/ });
  // Once hydrated the CTA gates on validity.
  await expect(cta).toBeDisabled();

  // Select a delivery country (clicking the tile checks its native radio).
  await page.locator('label.agegate__tile', { hasText: 'Nederland' }).click();
  await expect(cta).toBeDisabled(); // country only — not yet valid

  // Confirm 18+.
  await page.getByRole('checkbox', { name: /18 jaar of ouder/i }).check();
  await expect(cta).toBeEnabled();

  // Enter the store.
  await cta.click();

  // Storefront now renders; gate is gone.
  await expect(page.getByTestId('resolved-store')).toBeVisible();
  await expect(page.getByRole('heading', { name: GATE_TITLE })).toHaveCount(0);

  // Consent persisted in the cookie.
  const cookies = await context.cookies();
  const gateCookie = cookies.find((c) => c.name === 'nbns_gate');
  expect(gateCookie, 'nbns_gate cookie was set').toBeTruthy();

  // Reload: a returning visitor with a valid cookie does NOT see the gate again.
  await page.reload();
  await expect(page.getByTestId('resolved-store')).toBeVisible();
  await expect(page.getByRole('heading', { name: GATE_TITLE })).toHaveCount(0);

  await context.close();
});
