import { expect, test } from '@playwright/test';

/**
 * V0.1.0 smoke E2E: the app boots and the root route renders without a runtime
 * error. Feature flows (age-gate, home render, selectors) arrive with their
 * own issues.
 */
test('root route responds and renders a body', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'navigation returned a response').not.toBeNull();
  expect(response!.status(), 'root route status is not an error').toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});
