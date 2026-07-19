import { existsSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from '@playwright/test';

// The Playwright *test runner* process (this file, and every spec) does NOT
// get `.env.local` loaded automatically — only the `pnpm dev` child process
// spawned by `webServer` does that (Next's own env loading). The
// admin-round-trip suite needs `REVALIDATE_SECRET` and the Magento admin
// creds in ITS OWN process to send authed requests, so load the same file
// here via Node's built-in env-file loader. This only affects plain string
// env vars — it must NOT be relied on for `NODE_EXTRA_CA_CERTS` (TLS trust is
// read once at process bootstrap, before this file runs, so setting it this
// late has no effect; see the admin-round-trip spec for why it uses
// `ignoreHTTPSErrors` instead of relying on this env var for backend calls).
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

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
  // The suite runs against a PRODUCTION build (`next build && next start`), not
  // `next dev`. This is required, not a preference: the store-identity data
  // layer uses `'use cache'`, which Next *dev* mode does NOT persist — so the
  // revalidation / caching / safety-window assertions (admin-round-trip suite)
  // are only meaningful against a prod server, where the cache actually holds a
  // value between requests until an on-demand `revalidateTag` (or the 1h
  // `cacheLife` backstop) expires it. Prod `next start` also has no per-route
  // cold-compile step, so assertions are faster and steadier; the 10s expect
  // timeout + one retry remain as cheap insurance against first-hit latency.
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 1,
  fullyParallel: true,
  // Single worker: the admin-round-trip suite (e2e/admin-roundtrip.spec.ts)
  // mutates the SHARED live dev-backend store (native config + CMS blocks) that
  // every other spec's assertions also read (store name, tagline, footer
  // content, etc). Multiple workers would let another spec's page render land
  // mid-mutation and see a transient/edited value — a real flake, not a test
  // bug. One worker serializes every spec (including this file's own
  // `describe(..., { mode: 'serial' })` blocks) against that single backend,
  // trading a slower total run for determinism, which this suite prioritizes
  // explicitly over parallel speed.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
  },
  webServer: {
    // A production build is compiled then served: `next build && next start`.
    // The `next start` stdout/stderr is redirected to a fixed, gitignored log
    // file so the admin-round-trip suite can assert the
    // `store-identity:fail-closed field=<name>` marker (the compliance log
    // emitted by the store-identity adapter) was actually emitted for each
    // induced fail-closed case, without a bespoke log-capture harness. The `>`
    // binds to `next start` only (shell precedence in `A && B > file`), so the
    // build's own output still reaches Playwright's captured stdout while the
    // server's runtime log lands in the file the suite greps. A `> file`
    // REDIRECT is used rather than a `| tee` PIPE deliberately: with a pipe,
    // Playwright's webServer process-liveness detection sees the pipeline exit
    // semantics and reports "process exited early" before the URL is ready; a
    // plain redirect keeps `next start` in the foreground of the spawned shell,
    // and readiness is detected by polling `url` below, not by stdout.
    // NOTE: reuseExistingServer (non-CI) means a prod server already listening
    // on :3000 is reused and the build+start is skipped — run `pnpm build &&
    // pnpm start` yourself first for a fast local iteration loop.
    command: 'pnpm build && pnpm start > .e2e-dev-server.log 2>&1',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Generous: the `next build` runs inside this window before the server is
    // ready. A cold production build on CI can take a few minutes.
    timeout: 300_000,
    // The home page renders server-side against the local backend over HTTPS
    // with a locally-trusted (mkcert) certificate. `--use-system-ca` makes the
    // server's Node process trust the OS certificate store that `mkcert
    // -install` populates — a certificate env var read from `.env.local` is
    // applied too late to affect Node's TLS bootstrap. `pnpm start` (unlike
    // `pnpm dev`) does not set this itself, so the injected env below is what
    // makes the prod server trust the local backend cert.
    env: {
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
    },
  },
});
