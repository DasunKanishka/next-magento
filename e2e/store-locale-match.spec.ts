import { expect, test } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Store/UI locale-match E2E.
 *
 * This is an INVARIANT check, not a proxy: it asserts on the RENDERED DOM
 * TEXT that the store-locale (English) chrome copy is present and that the
 * pre-fix Dutch literals are ABSENT, across every surface migrated to the
 * store-locale catalog (`src/i18n/chrome-copy.ts`) — header/nav, mega-menu,
 * mobile menu, product card, the age/country compliance gate, the footer, and
 * the country/language selectors — INCLUDING the country/language display
 * NAMES (e.g. "Netherlands"/"Germany"/"English"), which are resolved via
 * `Intl.DisplayNames` keyed to the active store locale
 * (`src/i18n/display-names.ts`), never a hardcoded name table. A bare
 * `<html lang="en">` attribute assertion is explicitly insufficient (the
 * `lang` attribute can read English while chrome still renders Dutch — that
 * was exactly the H1 failure mode); every assertion below reads real
 * rendered/serialized text instead.
 *
 * `error.tsx`'s locale-match (the segment error boundary's chrome) is
 * exercised by the admin-round-trip suite's fail-closed cases, which already
 * induce that render path — not duplicated here.
 *
 * The HOME EMPTY-STATE locale-match (ProductOfMonth's/ProductRail's
 * empty-slot fallback copy) is asserted in `empty-backend.spec.ts` instead of
 * here: that spec already stands up the only fixture that reliably produces
 * an empty slot (a second server against a stub backend that returns zero
 * products everywhere) — spinning up a second copy of that heavyweight
 * fixture here just to re-check two strings would roughly double this file's
 * runtime for no additional coverage. See that spec's own assertions
 * (`'No product featured this month yet.'` / `'No products in this selection
 * right now.'` present, their Dutch originals absent).
 *
 * Runs against the production build (see `playwright.config.ts`'s
 * `webServer`), like every other spec in this directory.
 */

/** The pre-fix Dutch literals this invariant proves are gone from the chrome surfaces in scope. */
const BANNED_DUTCH_CHROME_LITERALS = [
  'Inloggen',
  'Zoek merk, soort of product',
  'Toevoegen aan winkelmandje',
  'Ontdek de volledige collectie',
];

test.describe('default (mobile, 390px) viewport', () => {
  test.beforeEach(async ({ context }) => {
    await seedConsent(context);
  });

  test('header + mobile-menu + product-card chrome render in English, not the pre-fix Dutch', async ({
    page,
  }) => {
    await page.goto('/en');
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Mobile search placeholder (HeaderShell's mobile subtree, visible at this
    // viewport). The desktop subtree's SearchBar shares the same placeholder
    // text (both resolve to the same store-locale catalog entry) and is still
    // in the DOM (CSS `display: none`, not unmounted) — `getByPlaceholder` is
    // a DOM query, not an accessibility-tree query, so it matches both;
    // filter to the one actually visible at this viewport. The desktop-only
    // "Sign in" entry point is asserted in the desktop viewport block below.
    await expect(
      page.getByPlaceholder('Search brand, type, or product…').filter({ visible: true }),
    ).toBeVisible();

    // ProductCard: at least one merchandising rail streamed in a real card.
    await expect(page.getByRole('button', { name: 'Add to cart' }).first()).toBeVisible();

    // Mobile drawer: open it and read the store-locale nav/language chrome.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Main menu' })).toBeVisible();
    await expect(page.getByRole('menu', { name: 'Language' })).toBeVisible();

    const html = await page.content();
    for (const banned of BANNED_DUTCH_CHROME_LITERALS) {
      expect(
        html,
        `must not render the pre-fix Dutch chrome literal "${banned}"`,
      ).not.toContain(banned);
    }
  });

  test('the footer renders its chrome (payment methods + 18+ notice) in English, not the pre-fix Dutch', async ({
    page,
  }) => {
    await page.goto('/en');
    await expect(page.getByTestId('home-page')).toBeVisible();

    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('list', { name: 'Payment methods' })).toBeVisible();
    await expect(footer.getByText(/18 years and older/)).toBeVisible();
    await expect(footer.getByText(/drink responsibly/)).toBeVisible();

    const footerHtml = await footer.innerHTML();
    for (const banned of ['Betaalmethoden', '18 jaar en ouder', 'drink met mate']) {
      expect(
        footerHtml,
        `footer must not render the pre-fix Dutch literal "${banned}"`,
      ).not.toContain(banned);
    }
  });

  test('the country/language selector labels AND display names render in English, not the pre-fix Dutch', async ({
    page,
  }) => {
    await page.goto('/en');
    await expect(page.getByTestId('home-page')).toBeVisible();

    // The mobile compact selector opens the same combined country+language
    // panel as the desktop one (see CountrySelector.tsx). Structural labels
    // ("Deliver to" trigger label, "Country"/"Language" column headings) AND
    // the country/language display NAMES themselves are both chrome now,
    // resolved to the store locale — the names via Intl.DisplayNames
    // (src/i18n/display-names.ts), never a hardcoded table.
    await page.getByRole('button', { name: /Delivery country: Netherlands/ }).click();
    const menu = page.getByRole('menu', { name: 'Country and language' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('group', { name: 'Country' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();

    // Display names, resolved via Intl.DisplayNames in the active (English)
    // locale — present.
    for (const present of [
      'Netherlands',
      'Germany',
      'Denmark',
      'Austria',
      'Belgium',
      'France',
      'Spain',
      'English',
    ]) {
      await expect(menu.getByText(present, { exact: true })).toBeVisible();
    }

    const menuHtml = await menu.innerHTML();
    for (const banned of [
      'Bezorgen naar',
      'Land en taal',
      '>Land<',
      '>Taal<',
      'Nederland<',
      'Duitsland',
      'Denemarken',
      'Oostenrijk',
      'België',
      'Frankrijk',
      'Spanje',
      '>Engels<',
    ]) {
      expect(
        menuHtml,
        `country/language selector must not render the pre-fix Dutch literal "${banned}"`,
      ).not.toContain(banned);
    }
  });
});

test.describe('desktop (1280px) viewport', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await seedConsent(context);
  });

  test('desktop nav landmark + mega-menu render in English, not the pre-fix Dutch', async ({
    page,
  }) => {
    await page.goto('/en');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    const trigger = page
      .locator('nav[aria-label="Main navigation"] button[aria-haspopup="true"]')
      .first();
    await trigger.hover();

    const region = page.getByRole('region', { name: /Category menu:/ });
    await expect(region).toBeVisible();
    await expect(region.getByRole('link', { name: /View all in/ })).toBeVisible();

    const html = await page.content();
    for (const banned of [
      ...BANNED_DUTCH_CHROME_LITERALS,
      'Hoofdnavigatie',
      'Bekijk alles in',
      'Categoriemenu',
    ]) {
      expect(
        html,
        `must not render the pre-fix Dutch chrome literal "${banned}"`,
      ).not.toContain(banned);
    }
  });
});

test.describe('age/country compliance gate (no consent seeded)', () => {
  test('the gate title, CTA, legal notice, and country tile names render in English, not the pre-fix Dutch', async ({
    page,
  }) => {
    // Deliberately NOT seeding consent — the gate is the render this test
    // targets.
    const response = await page.goto('/en');
    expect(response?.status(), 'status is not an error').toBeLessThan(400);

    await expect(
      page.getByRole('heading', { name: 'Where can we deliver to?' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter the store/ })).toBeVisible();
    // Legal/compliance-sensitive fine print — translated from the Dutch
    // original; flagged `needs-confirm` for legal review in this change's
    // handoff, not asserted here as a claim of legal accuracy, only that it
    // renders in English and not the untranslated Dutch original.
    await expect(page.getByText(/No sale of alcohol to persons under 18/)).toBeVisible();

    // Country tile names — resolved via Intl.DisplayNames in the active
    // (English) locale, never a hardcoded table (src/i18n/display-names.ts).
    for (const present of [
      'Netherlands',
      'Germany',
      'Denmark',
      'Austria',
      'Belgium',
      'France',
      'Spain',
    ]) {
      await expect(page.getByText(present, { exact: true })).toBeVisible();
    }

    const html = await page.content();
    for (const banned of [
      'Waar mogen we naartoe bezorgen?',
      'Kies je bezorgland',
      'De winkel betreden',
      'Geen verkoop van alcohol onder de 18 jaar',
      '>Nederland<',
      'Duitsland',
      'Denemarken',
      'Oostenrijk',
      'België',
      'Frankrijk',
      'Spanje',
    ]) {
      expect(
        html,
        `age gate must not render the pre-fix Dutch literal "${banned}"`,
      ).not.toContain(banned);
    }
  });
});
