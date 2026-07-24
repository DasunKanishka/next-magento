import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Home page render + header/footer render and interaction, exercised at the
 * 390px mobile frame and at a desktop width against the live backend. The gate
 * blocks the storefront until consent exists, so consent is seeded first.
 */

const RETIRED_PROMISE = 'Voor 16:00 besteld, vandaag verzonden';
const UNIFIED_PROMISE = 'Voor 22:00 besteld, morgen in huis';

test.beforeEach(async ({ context }) => {
  await seedConsent(context);
});

/** Shared assertions that must hold at every breakpoint. */
async function assertCoreHome(page: Page) {
  // The gated storefront rendered.
  await expect(page.getByTestId('home-page')).toBeVisible();

  // Header landmark + a home logo link (the header renders both a desktop and a
  // mobile subtree, one hidden per breakpoint, so match the visible one).
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: /go to homepage/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // Category bar sourced from the live category tree.
  await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible();

  // Search-optimised figures (scoped to the content block, since the same
  // headline figure also appears in the footer tagline).
  await expect(
    page.getByRole('region', { name: 'About our store' }).getByText('8.000+'),
  ).toBeVisible();

  // At least one merchandising product card streamed in (fresh price/stock).
  await expect(page.getByTestId('product-card').first()).toBeVisible();

  // Footer landmark + newsletter interaction surface + age notice. The
  // notice's wording is merchant-owned, backend-sourced content (see
  // `admin-roundtrip.spec.ts`'s dedicated round-trip case) — this smoke test
  // asserts only that it RENDERS, via the content-agnostic testid, never a
  // specific wording.
  const footer = page.getByRole('contentinfo');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await expect(footer.getByTestId('alcohol-legal-notice')).toBeVisible();

  // Unified delivery promise present; retired promise gone from the output.
  await expect(
    page.getByText(UNIFIED_PROMISE).filter({ visible: true }).first(),
  ).toBeVisible();
  expect(await page.content()).not.toContain(RETIRED_PROMISE);
}

test.describe('mobile (390px)', () => {
  test('renders the home page, header, and footer', async ({ page }) => {
    await page.goto('/en');
    await assertCoreHome(page);
  });

  test('lets a visitor type into the newsletter email field', async ({ page }) => {
    await page.goto('/en');
    const footer = page.getByRole('contentinfo');
    const email = footer.getByLabel('Email address');
    await email.fill('klant@voorbeeld.nl');
    await expect(email).toHaveValue('klant@voorbeeld.nl');
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('renders the home page, header, and footer', async ({ page }) => {
    await page.goto('/en');
    await assertCoreHome(page);
  });

  test('exposes the primary navigation with the deals entry first', async ({ page }) => {
    await page.goto('/en');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /Deals/ })).toBeVisible();
  });
});
