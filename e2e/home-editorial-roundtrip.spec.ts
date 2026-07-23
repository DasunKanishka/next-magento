import { expect, test, type APIRequestContext } from '@playwright/test';

import { HOME_CONTENT_ZONES, HOME_SEO_BLOCK_IDENTIFIER } from '@/config/content-zones';
import { resolveSlotCategoryId } from '@/config/merchandising-slots';

import { seedConsent } from './helpers';
import {
  adminEnvAvailable,
  backendCliAvailable,
  ensureCmsBlock,
  getCategoryName,
  getCmsBlockByIdentifier,
  setCategoryName,
  setCmsBlockContent,
  disposeAdminApiContext,
  REVALIDATE_SECRET,
} from './lib/magento-admin';

/**
 * Home-editorial admin round-trip — extends the store-identity round-trip
 * pattern (`admin-roundtrip.spec.ts`, store-identity fields only) to the home
 * content zones that pattern did NOT cover: the six structured
 * `HOME_STRUCTURED_ZONE_IDENTIFIERS` zones, the free-form `home_seo_content`
 * block, and the four merchandising-rail headings (sourced from each slot's
 * native curation-category name, not a CMS block — see `getHomeShellData`).
 *
 * Same shared-state discipline as the parent suite: serial mode, one worker
 * (`playwright.config.ts`), and every mutating case restores the original
 * value in `finally`.
 */

test.describe.configure({ mode: 'serial' });
test.use({ ignoreHTTPSErrors: true });

test.describe('home-editorial round-trip (live dev backend)', () => {
  test.beforeEach(() => {
    test.skip(
      !adminEnvAvailable(),
      'needs-confirm.: MAGENTO_ADMIN_BASE_URL/USER/PASSWORD or MAGENTO_GRAPHQL_ENDPOINT is not set in .env.local — home-editorial round-trip suite cannot run.',
    );
    test.skip(
      !backendCliAvailable(),
      'needs-confirm.: sibling backend repo (../backend, `make magento`) not found — home-editorial round-trip suite cannot run.',
    );
    test.setTimeout(120_000);
  });

  test.afterAll(async () => {
    await disposeAdminApiContext();
  });

  // Home editorial lives under the `home-shell` cache tag (getHomeShellData),
  // NOT `store-identity` — so this suite must revalidate that tag explicitly
  // (the default tag would flip the header/footer, never the home content).
  async function revalidateHomeShell(request: APIRequestContext) {
    const resp = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': REVALIDATE_SECRET },
      data: { tag: 'home-shell' },
    });
    expect(
      resp.status(),
      'authed POST /api/revalidate { tag: home-shell } should return 200',
    ).toBe(200);
  }

  test('hero (home_hero CMS block)', async ({ page, request }) => {
    const identifier = HOME_CONTENT_ZONES.hero.identifier;
    const block = await getCmsBlockByIdentifier(identifier);
    const original = block.content;
    const newTitle = 'QA E2E Hero Title';
    try {
      await setCmsBlockContent(
        block.id,
        `<div class="hero-slide"><h2>${newTitle}</h2><p>QA E2E hero body.</p></div>`,
      );
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('banners row 1 (home_banners_1 CMS block)', async ({ page, request }) => {
    const identifier = HOME_CONTENT_ZONES.banners1.identifier;
    const block = await getCmsBlockByIdentifier(identifier);
    const original = block.content;
    const newTitle = 'QA E2E Banner Row 1';
    try {
      await setCmsBlockContent(
        block.id,
        `<div class="banner-tile"><h3>${newTitle}</h3><p>QA E2E banner body.</p></div>`,
      );
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(page.getByRole('heading', { level: 3, name: newTitle })).toBeVisible();
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('business reviews (home_business_reviews CMS block)', async ({
    page,
    request,
  }) => {
    const identifier = HOME_CONTENT_ZONES.businessReviews.identifier;
    const block = await getCmsBlockByIdentifier(identifier);
    const original = block.content;
    const newScore = 'QA-E2E 5,0';
    try {
      await setCmsBlockContent(
        block.id,
        `<div class="reviews-summary"><p><strong>${newScore}</strong> op basis van QA-e2e beoordelingen</p></div>`,
      );
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(page.getByText(newScore)).toBeVisible();
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('product-of-month editorial (home_product_of_month_editorial CMS block)', async ({
    page,
    request,
  }) => {
    const identifier = HOME_CONTENT_ZONES.productOfMonthEditorial.identifier;
    const block = await getCmsBlockByIdentifier(identifier);
    const original = block.content;
    const newCopy = 'QA E2E product-of-month narrative probe.';
    try {
      await setCmsBlockContent(
        block.id,
        `<div class="product-of-month-editorial"><p>${newCopy}</p></div>`,
      );
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(page.getByText(newCopy)).toBeVisible();
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('SEO copy (home_seo_content CMS block, free-form)', async ({ page, request }) => {
    const block = await getCmsBlockByIdentifier(HOME_SEO_BLOCK_IDENTIFIER);
    const original = block.content;
    const newCopy = 'QA E2E SEO copy round-trip probe.';
    try {
      await setCmsBlockContent(block.id, `<p>${newCopy}</p>`);
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(page.getByTestId('seo-copy').getByText(newCopy)).toBeVisible();
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('stat callouts (home_stat_callouts CMS block — the previously-hardcoded proof points)', async ({
    page,
    request,
  }) => {
    const identifier = HOME_CONTENT_ZONES.statCallouts.identifier;
    // This zone is newly introduced, so ensure it exists (creating it via the
    // same admin REST API path used to author it) before the round trip — a
    // fresh/restored backend without it still runs this case.
    const block = await ensureCmsBlock({
      identifier,
      title: 'Home Stat Callouts',
      defaultContent:
        '<div class="stat-callout"><strong>8.000+</strong><p>producten op voorraad</p></div>',
    });
    const original = block.content;
    const newValue = 'QA-E2E-9999';
    try {
      await setCmsBlockContent(
        block.id,
        `<div class="stat-callout"><strong>${newValue}</strong><p>QA e2e stat label</p></div>`,
      );
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      // Scope to the SEO content region: `8.000+` also legitimately appears in
      // the footer tagline (a store-identity field), so a page-wide negative
      // check would match that unrelated occurrence.
      const seoRegion = page.getByRole('region', { name: 'About our store' });
      await expect(seoRegion.getByText(newValue)).toBeVisible();
      // The previously-hardcoded figure must be gone from the stat grid now
      // that the block carries only the QA fixture item — proves the render is
      // genuinely driven by the block's CURRENT content, not a constant-length
      // fallback list padded around it.
      await expect(seoRegion.getByText('8.000+')).toHaveCount(0);
    } finally {
      await setCmsBlockContent(block.id, original);
      await revalidateHomeShell(request);
    }
  });

  test('rail heading (native curation-category name, not a CMS block)', async ({
    page,
    request,
  }) => {
    const categoryId = resolveSlotCategoryId('highlighted');
    const original = await getCategoryName(categoryId);
    const newHeading = 'QA E2E Rail Heading';
    try {
      await setCategoryName(categoryId, newHeading);
      await revalidateHomeShell(request);

      await seedConsent(page.context());
      await page.goto('/en');
      await expect(
        page.getByRole('heading', { level: 2, name: newHeading }),
      ).toBeVisible();
    } finally {
      await setCategoryName(categoryId, original);
      await revalidateHomeShell(request);
    }
  });
});
