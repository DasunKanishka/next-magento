import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Real-browser interaction coverage for the two primary navigation surfaces:
 * the desktop mega-menu and the mobile hamburger drawer. The unit suite proves
 * their markup; this exercises the actual pointer/keyboard behaviors (open,
 * dismiss paths, one-panel-at-a-time, drill-down) against the live category
 * tree, which only a browser can do.
 *
 * The consent gate blocks every storefront route until consent exists, so each
 * test seeds a valid cookie before navigating.
 */

test.beforeEach(async ({ context }) => {
  await seedConsent(context);
});

const megaRegion = (page: Page) => page.getByRole('region', { name: /Categoriemenu/ });

const navTriggers = (page: Page) =>
  page.locator('nav[aria-label="Hoofdnavigatie"] button[aria-haspopup="true"]');

test.describe('desktop mega-menu', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('opens a three-column panel on hover', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const trigger = navTriggers(page).first();
    await trigger.hover();

    const region = megaRegion(page);
    await expect(region).toBeVisible();
    // Left rail (category links), middle column (subtypes/heading), and the
    // right promo tile "shop all" link together make the three columns.
    await expect(region.getByRole('link', { name: /Bekijk alles in/ })).toBeVisible();
    expect(await region.getByRole('link').count()).toBeGreaterThan(1);
  });

  test('shows only one panel at a time', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const triggers = navTriggers(page);
    if ((await triggers.count()) < 2) test.skip(true, 'needs >=2 top-level categories');

    await triggers.nth(0).hover();
    await expect(megaRegion(page)).toBeVisible();
    const firstLabel = await megaRegion(page).getAttribute('aria-label');

    await triggers.nth(1).hover();
    // Still exactly one open panel, now for the second category.
    await expect(megaRegion(page)).toHaveCount(1);
    const secondLabel = await megaRegion(page).getAttribute('aria-label');
    expect(secondLabel).not.toBe(firstLabel);
  });

  test('closes on mouse-leave', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await navTriggers(page).first().hover();
    await expect(megaRegion(page)).toBeVisible();

    // Move the pointer up to the logo (out of the nav row) -> mouse-leave.
    await page
      .getByRole('link', { name: /homepagina/ })
      .first()
      .hover();
    await expect(megaRegion(page)).toHaveCount(0);
  });

  test('closes on click-outside', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await navTriggers(page).first().hover();
    await expect(megaRegion(page)).toBeVisible();

    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await expect(megaRegion(page)).toHaveCount(0);
  });

  test('closes on Escape', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await navTriggers(page).first().hover();
    await expect(megaRegion(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(megaRegion(page)).toHaveCount(0);
  });
});

test.describe('mobile drawer (390px)', () => {
  test('opens the drawer with the language list', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByRole('button', { name: 'Menu openen' }).click();
    const drawer = page.getByRole('navigation', { name: 'Hoofdmenu' });
    await expect(drawer).toBeVisible();

    // The language list at the bottom is a menu of radio options.
    const langMenu = drawer.getByRole('menu', { name: 'Taal' });
    await expect(langMenu).toBeVisible();
    expect(await langMenu.getByRole('menuitemradio').count()).toBeGreaterThan(1);
  });

  test('drills into a category and returns via the back control', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByRole('button', { name: 'Menu openen' }).click();
    const drawer = page.getByRole('navigation', { name: 'Hoofdmenu' });
    await expect(drawer).toBeVisible();

    const drill = drawer.locator('button[aria-label*="submenu openen"]').first();
    if ((await drill.count()) === 0) {
      test.skip(true, 'no category with subtypes in the live tree');
    }
    await drill.click();

    // Second level: an "Alles in ..." link plus the back control.
    await expect(drawer.getByRole('link', { name: /^Alles in / })).toBeVisible();
    const back = drawer.getByRole('button', { name: /terug/ });
    await expect(back).toBeVisible();

    await back.click();
    // Back at the root list: the language section is visible again.
    await expect(drawer.getByRole('menu', { name: 'Taal' })).toBeVisible();
  });
});
