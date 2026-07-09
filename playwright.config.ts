import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E config. V0.1.0 ships a single smoke spec; the full age-gate /
 * home-render / selector suites (E2E test coverage) are added with their
 * feature work.
 *
 * Viewport is pinned to 390px to match the design frame and the mobile-first
 * scope — this is layout fidelity, distinct from the Lighthouse mobile-preset
 * perf lab.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
