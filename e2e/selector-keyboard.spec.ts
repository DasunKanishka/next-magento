import { expect, test } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Keyboard operability of the header country/language selector — the dimension
 * axe cannot exercise. Confirms each dropdown column is a labeled group, that
 * ArrowUp/ArrowDown roves focus across the options with wrap-around, and that
 * Escape closes the panel and returns focus to the trigger.
 */

test.beforeEach(async ({ context }) => {
  await seedConsent(context);
});

test('columns are labeled groups and Arrow keys rove focus with wrap-around', async ({
  page,
}) => {
  await page.goto('/en');
  await expect(page.getByTestId('home-page')).toBeVisible();

  const trigger = page.getByRole('button', { name: /Delivery country: Netherlands/ });
  await trigger.click();

  const menu = page.getByRole('menu', { name: 'Country and language' });
  await expect(menu).toBeVisible();

  // Each column's radio set is wrapped in a labeled group.
  await expect(page.getByRole('group', { name: 'Country' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();

  const options = menu.getByRole('menuitemradio');
  const optionCount = await options.count();
  expect(optionCount).toBeGreaterThan(2);

  // The first option receives focus when the panel opens.
  await expect(options.first()).toBeFocused();

  // ArrowDown advances, ArrowUp retreats.
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(options.first()).toBeFocused();

  // ArrowUp from the first option wraps to the last.
  await page.keyboard.press('ArrowUp');
  await expect(options.nth(optionCount - 1)).toBeFocused();

  // End/Home jump to the last/first option.
  await page.keyboard.press('Home');
  await expect(options.first()).toBeFocused();
  await page.keyboard.press('End');
  await expect(options.nth(optionCount - 1)).toBeFocused();
});

test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByTestId('home-page')).toBeVisible();

  const trigger = page.getByRole('button', { name: /Delivery country: Netherlands/ });
  await trigger.click();
  await expect(page.getByRole('menu', { name: 'Country and language' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'Country and language' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
