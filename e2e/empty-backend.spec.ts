import { expect, test } from '@playwright/test';

import { seedConsent } from './helpers';
import {
  EMPTY_BACKEND_BASE_URL,
  startEmptyBackendFixture,
  stopEmptyBackendFixture,
  type EmptyBackendFixture,
} from './lib/empty-backend-fixture';

/**
 * The invariant-level empty-backend gate.
 *
 * The per-content-type round-trip suite (`admin-roundtrip.spec.ts`) enumerates
 * known fields and edits each one against the LIVE dev backend; it never once
 * renders the home route against a backend with NOTHING authored. That is
 * exactly the gap a hardcoded `SeoContent` stat-callout set slipped through
 * once: every enumerated round trip passed because the figures were never
 * sourced from the backend at all. This spec closes that gap directly — it
 * renders the home route against a genuinely empty backend and asserts every
 * zone degrades gracefully with NO static/hardcoded content, rather than
 * asserting any one enumerated field.
 *
 * Runs against a PRODUCTION build (a second `next start` instance reusing the
 * `.next` build the main suite's `webServer` already produced — see
 * `lib/empty-backend-fixture.ts`): dev mode does not persist `'use cache'`, so
 * a dev-mode render would not exercise the same code path a real deploy does.
 */

test.describe('empty backend (invariant gate)', () => {
  let fixture: EmptyBackendFixture;

  test.beforeAll(async () => {
    fixture = await startEmptyBackendFixture();
  });

  test.afterAll(async () => {
    await stopEmptyBackendFixture(fixture ?? {});
  });

  test('home route renders no proof-point figures and no static editorial when nothing is authored', async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: EMPTY_BACKEND_BASE_URL });
    await seedConsent(context, EMPTY_BACKEND_BASE_URL);
    const page = await context.newPage();

    const response = await page.goto('/en');
    // Graceful, not the fail-closed error boundary: the stub's storeConfig +
    // `store_identity_legal` block are just enough to satisfy the
    // store-identity fail-closed gate, so a 500 here would mean the fixture
    // itself is misconfigured, not that the invariant under test failed.
    expect(response?.status(), 'home route must render successfully').toBe(200);
    await expect(page.getByTestId('home-page')).toBeVisible();

    // AC3 — the literal proof-point check: no `.statValue`-class element
    // anywhere (production CSS Modules append the source class name as a
    // suffix, e.g. `SeoContent-module__<hash>__statValue`, so a substring
    // match is exact and stable across rebuilds).
    await expect(page.locator('[class*="statValue"]')).toHaveCount(0);

    // No free-form SEO copy panel (home_seo_content unauthored).
    await expect(page.getByTestId('seo-copy')).toHaveCount(0);

    // No h2 anywhere in <main>: the hero slider, the four merchandising rail
    // headings, the "shop by category" bar, and the reviews band are ALL
    // gated on authored content (or, for the rail headings, on a native
    // category name — see `getHomeShellData`) — none of them is a hardcoded
    // fallback, so with an empty backend none renders at all.
    await expect(page.locator('main').getByRole('heading', { level: 2 })).toHaveCount(0);

    // No merchandising or product-of-month product card (every slot's
    // category returns zero products against the stub).
    await expect(page.getByTestId('product-card')).toHaveCount(0);

    // No aggregate score / testimonial band.
    await expect(page.getByRole('region', { name: 'Customer reviews' })).toHaveCount(0);

    // Store/UI locale-match (see store-locale-match.spec.ts): the empty-slot
    // fallback copy this fixture is uniquely positioned to exercise (every
    // slot returns zero products only here) renders in the store locale
    // (English), not the pre-fix Dutch original.
    await expect(page.getByText('No product featured this month yet.')).toBeVisible();
    // Every merchandising rail (4 slots) is empty against the stub, so this
    // fallback note renders once per rail — assert the first occurrence.
    await expect(
      page.getByText('No products in this selection right now.').first(),
    ).toBeVisible();

    // Belt-and-braces: none of the LIVE dev-store's real authored editorial
    // strings leaked through — a guard against the fixture's own env-var
    // repoint silently failing and the page rendering the real backend
    // instead (which would make every assertion above a false negative).
    const bodyText = (await page.locator('main').innerText()).trim();
    for (const liveContent of [
      'Zomerse borrel',
      'Outlet',
      '4,7 van de 5',
      'Wijn, bier en sterke drank',
      '€34,95',
      '8.000+',
    ]) {
      expect(
        bodyText,
        `must not contain live-backend content "${liveContent}"`,
      ).not.toContain(liveContent);
    }

    // Pre-fix Dutch empty-state copy must not render either (the store/UI
    // locale-match invariant — see store-locale-match.spec.ts).
    for (const banned of [
      'Er is deze maand nog geen product uitgelicht.',
      'Er zijn op dit moment geen producten in deze selectie.',
    ]) {
      expect(
        bodyText,
        `must not render the pre-fix Dutch empty-state copy "${banned}"`,
      ).not.toContain(banned);
    }

    await context.close();
  });
});
