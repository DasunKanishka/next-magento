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
  // The dev web server compiles each locale route on its first request; under
  // full parallelism a first hit to an un-compiled route can exceed the 5s
  // default web-first-assertion timeout, so give assertions more headroom and
  // allow a retry to absorb that cold-compile latency (production `next start`,
  // which the perf gate uses, has no such compile step).
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 1,
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
    // The home page renders server-side against the local backend over HTTPS
    // with a locally-trusted (mkcert) certificate. `--use-system-ca` makes the
    // dev server's Node process trust the OS certificate store that `mkcert
    // -install` populates — a certificate env var read from `.env.local` is
    // applied too late to affect Node's TLS bootstrap.
    env: {
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
    },
  },
});
