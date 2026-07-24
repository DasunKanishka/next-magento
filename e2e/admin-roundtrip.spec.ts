import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  STORE_IDENTITY_LEGAL_BLOCK,
  STORE_IDENTITY_TAGLINE_BLOCK,
  STORE_FOOTER_PAYMENT_METHODS_BLOCK,
  STORE_FOOTER_COLUMNS_BLOCK,
  STORE_DELIVERY_PROMISE_BLOCK,
} from '@/config/store-identity-content';

import { seedConsent } from './helpers';
import {
  adminEnvAvailable,
  backendCliAvailable,
  setStoreViewName,
  getCmsBlockByIdentifier,
  setCmsBlockContent,
  magentoConfigSet,
  magentoConfigDelete,
  readStoreConfigSnapshot,
  devServerLogOffset,
  waitForFailClosedMarker,
  readStoreIdentityAdapterSource,
  disposeAdminApiContext,
  REVALIDATE_SECRET,
} from './lib/magento-admin';

/**
 * Terminal admin-round-trip + fail-closed E2E, against the LIVE dev Magento
 * backend. Every test in this file edits shared store state (native config
 * or a native CMS block), which is why:
 *
 *   - The whole file runs `mode: 'serial'` — tests never interleave with
 *     each other, and each restores what it changed in a `finally` before
 *     the next one starts.
 *   - `playwright.config.ts` pins `workers: 1` for the whole suite, so no
 *     OTHER spec file's page render can land mid-mutation either.
 *   - Every mutating test captures the pre-existing value first and restores
 *     it in `finally`, so a mid-test failure never leaves the dev store
 *     altered (Iron-Law-adjacent to this repo's own determinism bar).
 *
 * Requires `MAGENTO_ADMIN_BASE_URL` / `MAGENTO_ADMIN_USER` /
 * `MAGENTO_ADMIN_PASSWORD` / `MAGENTO_GRAPHQL_ENDPOINT` (`.env.local`) and the
 * sibling backend repo (`make magento`) — the whole file is skipped with a
 * clear reason (not silently, not faked as a pass) when either is absent.
 */

test.describe.configure({ mode: 'serial' });

// The admin host (https://249.magento.default) uses a locally mkcert-issued
// certificate. Node's TLS trust store (NODE_EXTRA_CA_CERTS) can't be relied
// on this late in this process (see playwright.config.ts), so every context
// in this file bypasses cert validation instead — acceptable for a
// test-harness-only call to a known local dev host.
test.use({ ignoreHTTPSErrors: true });

test.describe('admin round-trip + fail-closed (live dev backend)', () => {
  test.beforeEach(() => {
    test.skip(
      !adminEnvAvailable(),
      'needs-confirm.: MAGENTO_ADMIN_BASE_URL/USER/PASSWORD or MAGENTO_GRAPHQL_ENDPOINT is not set in .env.local — admin-round-trip suite cannot run.',
    );
    test.skip(
      !backendCliAvailable(),
      'needs-confirm.: sibling backend repo (../backend, `make magento`) not found — admin-round-trip suite cannot run.',
    );
    // Every case here drives the live backend: a native-config or store-table
    // edit is followed by `cache:flush` (which can make Magento recompile on
    // the next request) plus an on-demand revalidate and a fresh SSR render.
    // That chain routinely exceeds the suite's default 30s budget, so give
    // every test in this file real headroom rather than tuning per test.
    test.setTimeout(120_000);
  });

  test.afterAll(async () => {
    await disposeAdminApiContext();
  });

  async function revalidateAuthed(request: APIRequestContext) {
    const resp = await request.post('/api/revalidate', {
      headers: { 'x-revalidate-secret': REVALIDATE_SECRET },
    });
    expect(resp.status(), 'authed POST /api/revalidate should return 200').toBe(200);
  }

  // ── Edit-in-admin → frontend, per content type ───────────────────────────

  test.describe('content-type round trips', () => {
    test('store name (store-view Name field, via a direct native-source edit)', async ({
      page,
      request,
    }) => {
      const before = await readStoreConfigSnapshot();
      const originalName = before.store_name ?? '';
      const newName = 'QA E2E Store Name';
      try {
        setStoreViewName(newName);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
          newName,
        );
      } finally {
        setStoreViewName(originalName);
        await revalidateAuthed(request);
      }
    });

    test('copyright (design/footer/copyright, via the admin config CLI)', async ({
      page,
      request,
    }) => {
      const before = await readStoreConfigSnapshot();
      const original = before.copyright ?? '';
      const newCopyright = 'QA E2E Copyright Holder B.V.';
      try {
        magentoConfigSet('design/footer/copyright', newCopyright);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newCopyright)).toBeVisible();
      } finally {
        magentoConfigSet('design/footer/copyright', original);
        await revalidateAuthed(request);
      }
    });

    test('tagline (store_identity_tagline CMS block, via the admin REST API)', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_IDENTITY_TAGLINE_BLOCK);
      const original = block.content;
      const newTagline = 'QA E2E tagline round-trip probe';
      try {
        await setCmsBlockContent(block.id, `<p>${newTagline}</p>`);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newTagline)).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });

    test('registration number / KvK (store_identity_legal CMS block, via the admin REST API)', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_IDENTITY_LEGAL_BLOCK);
      const original = block.content;
      const newRegistrationNumber = 'KvK QA-99999999';
      const edited = original.replace(
        /<span class="registration-number">[\s\S]*?<\/span>/,
        `<span class="registration-number">${newRegistrationNumber}</span>`,
      );
      expect(
        edited,
        'test fixture assumption: legal block carries a .registration-number span',
      ).not.toBe(original);
      try {
        await setCmsBlockContent(block.id, edited);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(
          page.getByRole('contentinfo').getByText(newRegistrationNumber),
        ).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });

    test('payment methods (store_footer_payment_methods CMS block, via the admin REST API)', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_FOOTER_PAYMENT_METHODS_BLOCK);
      const original = block.content;
      const newMethod = 'QA-E2E-Payment-Method';
      try {
        await setCmsBlockContent(block.id, `<ul>\n<li>${newMethod}</li>\n</ul>`);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(
          page.getByRole('contentinfo').getByRole('listitem', { name: newMethod }),
        ).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });

    test('footer columns (store_footer_columns CMS block, via the admin REST API)', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_FOOTER_COLUMNS_BLOCK);
      const original = block.content;
      const newHeading = 'QA E2E Column';
      const newLinkLabel = 'QA E2E Link';
      const edited = `<div class="footer-column"><h3>${newHeading}</h3><ul><li><a href="/qa-e2e">${newLinkLabel}</a></li></ul></div>`;
      try {
        await setCmsBlockContent(block.id, edited);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        const nav = page.getByRole('navigation', { name: newHeading });
        await expect(nav).toBeVisible();
        await expect(nav.getByRole('link', { name: newLinkLabel })).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });

    test('delivery promise (store_delivery_promise CMS block, via the admin REST API)', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_DELIVERY_PROMISE_BLOCK);
      const original = block.content;
      const newCopy = 'QA E2E delivery promise copy';
      const edited = `<p class="delivery-copy">${newCopy}</p>\n<p class="delivery-cutoff-hour">23</p>`;
      try {
        await setCmsBlockContent(block.id, edited);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        await expect(
          page.getByText(newCopy).filter({ visible: true }).first(),
        ).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });
  });

  // ── Logo: both the image path and the text-wordmark fallback ────────────

  test.describe('logo both paths', () => {
    test('header_logo_src set → <img>+alt; unset (restored) → text wordmark', async ({
      page,
      request,
    }) => {
      const before = await readStoreConfigSnapshot();
      const originalAlt = before.logo_alt ?? '';
      const storeName = before.store_name ?? '';
      // Baseline check: the dev store ships with no logo configured, so the
      // "unset" half of this test is exercised by restoring to THIS state.
      expect(
        before.header_logo_src,
        'test precondition: dev store starts with no logo configured',
      ).toBeNull();

      try {
        magentoConfigSet('design/header/logo_src', 'logo.png');
        magentoConfigSet('design/header/logo_alt', 'QA Logo Alt');
        await revalidateAuthed(request);

        await seedConsent(page.context());
        await page.goto('/en');
        const homeLink = page
          .getByRole('link', { name: /go to homepage/ })
          .filter({ visible: true })
          .first();
        const img = homeLink.locator('img');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('alt', 'QA Logo Alt');
        await expect(img).toHaveAttribute('src', /logo\.png/);
      } finally {
        magentoConfigDelete('design/header/logo_src');
        magentoConfigSet('design/header/logo_alt', originalAlt);
        await revalidateAuthed(request);
      }

      // Unset path, now restored to the dev store's baseline: text wordmark.
      await page.goto('/en');
      const homeLinkAfter = page
        .getByRole('link', { name: /go to homepage/ })
        .filter({ visible: true })
        .first();
      await expect(homeLinkAfter.locator('img')).toHaveCount(0);
      await expect(homeLinkAfter).toContainText(storeName);
    });
  });

  // ── Fail-closed: name, registrationNumber, copyright ─────────────────────

  test.describe('fail-closed (F2 — name, registrationNumber, copyright)', () => {
    test('name — empty at the native source ⇒ error boundary, not a partial render', async ({
      page,
      request,
    }) => {
      const before = await readStoreConfigSnapshot();
      const original = before.store_name ?? '';
      const offset = devServerLogOffset();
      try {
        setStoreViewName('');
        await revalidateAuthed(request);

        await seedConsent(page.context());
        const resp = await page.goto('/en');
        expect(resp?.status(), 'fail-closed render must be non-200').toBe(500);
        await expect(
          page.getByRole('status').getByText('Something went wrong'),
        ).toBeVisible();
        expect(
          await waitForFailClosedMarker(offset, 'name'),
          'expected the store-identity:fail-closed field=name marker in the server log',
        ).toBe(true);
      } finally {
        setStoreViewName(original);
        await revalidateAuthed(request);
      }
    });

    test('copyright — empty at the native source ⇒ error boundary, not a partial render', async ({
      page,
      request,
    }) => {
      const before = await readStoreConfigSnapshot();
      const original = before.copyright ?? '';
      const offset = devServerLogOffset();
      try {
        magentoConfigSet('design/footer/copyright', '');
        await revalidateAuthed(request);

        await seedConsent(page.context());
        const resp = await page.goto('/en');
        expect(resp?.status(), 'fail-closed render must be non-200').toBe(500);
        await expect(
          page.getByRole('status').getByText('Something went wrong'),
        ).toBeVisible();
        expect(
          await waitForFailClosedMarker(offset, 'copyright'),
          'expected the store-identity:fail-closed field=copyright marker in the server log',
        ).toBe(true);
      } finally {
        magentoConfigSet('design/footer/copyright', original);
        await revalidateAuthed(request);
      }
    });

    test('registrationNumber — unavailable at the native source ⇒ error boundary, not a partial render', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_IDENTITY_LEGAL_BLOCK);
      const original = block.content;
      const offset = devServerLogOffset();
      const withoutRegistrationNumber = original.replace(
        /<span class="registration-number">[\s\S]*?<\/span>/,
        '',
      );
      expect(
        withoutRegistrationNumber,
        'test fixture assumption: legal block carries a .registration-number span to remove',
      ).not.toBe(original);
      try {
        await setCmsBlockContent(block.id, withoutRegistrationNumber);
        await revalidateAuthed(request);

        await seedConsent(page.context());
        const resp = await page.goto('/en');
        expect(resp?.status(), 'fail-closed render must be non-200').toBe(500);
        await expect(
          page.getByRole('status').getByText('Something went wrong'),
        ).toBeVisible();
        expect(
          await waitForFailClosedMarker(offset, 'registrationNumber'),
          'expected the store-identity:fail-closed field=registrationNumber marker in the server log',
        ).toBe(true);
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });
  });

  // ── Revalidation auth + timing, and the safety-window backstop ──────────

  test.describe('revalidation auth + timing + safety-window backstop', () => {
    test('no trigger ⇒ cached value persists; unauthenticated revalidate is rejected + changes nothing; authed revalidate flips it immediately', async ({
      page,
      request,
    }) => {
      const block = await getCmsBlockByIdentifier(STORE_IDENTITY_TAGLINE_BLOCK);
      const original = block.content;
      const newTagline = 'QA E2E revalidation-timing probe';
      try {
        // PRIME the cache with the pre-edit value FIRST. Entering this test the
        // `store-identity` tag is expired — every prior round-trip test ends
        // its finally with an authed revalidate — so without an explicit
        // priming render the very first `/en` hit after the edit would be a
        // cache MISS that fetches the already-edited value, making the
        // "cache persists" assertion impossible to satisfy for reasons that
        // have nothing to do with the safety window. Expire, then render once,
        // to seat the OLD value inside a fresh 1h `cacheLife` window. The
        // trivially-true count(0) also awaits the SSR render so the cache is
        // definitely seated before we mutate the backend.
        await seedConsent(page.context());
        await revalidateAuthed(request);
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newTagline)).toHaveCount(0);

        // Edit the backend with NO trigger. The storefront must keep serving
        // the SERVER-cached (1h `cacheLife`) old value seated above. This is
        // the live, bounded-time proxy for the safety-window backstop — it
        // proves a cache window is actually in effect (not "no cache at all")
        // without waiting the full 1h in CI; see the companion static-source
        // assertion below for the exact window length.
        await setCmsBlockContent(block.id, `<p>${newTagline}</p>`);
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newTagline)).toHaveCount(0);

        // Unauthenticated revalidate: rejected, storefront still unchanged.
        const unauthedResp = await request.post('/api/revalidate', { data: {} });
        expect(unauthedResp.status()).toBe(401);
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newTagline)).toHaveCount(0);

        // Authed revalidate: on-demand precedence — visible on the very next request.
        const authedResp = await request.post('/api/revalidate', {
          headers: { 'x-revalidate-secret': REVALIDATE_SECRET },
        });
        expect(authedResp.status()).toBe(200);
        await page.goto('/en');
        await expect(page.getByRole('contentinfo').getByText(newTagline)).toBeVisible();
      } finally {
        await setCmsBlockContent(block.id, original);
        await revalidateAuthed(request);
      }
    });

    test('safety-window: the cached store-identity read declares a 1h cacheLife via a top-level use-cache function (static source assertion — no 1h wait in CI)', () => {
      const source = readStoreIdentityAdapterSource();
      // The cached read MUST be a module-level `async function` (Next only
      // transforms `'use cache'` on file-level / top-level functions, not
      // object-method shorthand — a method directive is a silent no-op that
      // disables caching entirely). Anchor on that function, not the adapter
      // method, and assert the directive/tag/window all live inside it. This is
      // the static guard against the object-method-shorthand regression the
      // behavioural companion test above caught at runtime.
      const loaderStart = source.indexOf('export async function loadStoreIdentity');
      expect(
        loaderStart,
        'the cached store-identity read (export async function loadStoreIdentity) not found in the adapter source',
      ).toBeGreaterThan(-1);
      const loaderBody = source.slice(loaderStart, loaderStart + 2000);
      expect(
        loaderBody,
        "loadStoreIdentity must open with a top-level 'use cache' directive",
      ).toMatch(
        /loadStoreIdentity[\s\S]*?\)\s*:\s*Promise<StoreIdentity>\s*\{\s*[\r\n]\s*'use cache';/,
      );
      expect(
        loaderBody,
        "the cached read must tag 'store-identity' for on-demand revalidation",
      ).toMatch(/cacheTag\(\s*['"]store-identity['"]\s*\)/);
      expect(loaderBody, 'the cached read must declare a 1h cacheLife window').toMatch(
        /cacheLife\(\s*['"]hours['"]\s*\)/,
      );
      // On-demand precedence over that window is demonstrated BEHAVIORALLY by
      // the companion test above: an edit made with no trigger stays on the
      // cached value until the authed POST /api/revalidate call, which then
      // supersedes it immediately. So the 1h window is the guaranteed
      // staleness BOUND when no trigger fires, never a lower bound. There is
      // no Magento-side webhook to test here — headless, none exists — the
      // revalidate endpoint is the sole, optional fast path.
    });
  });
});
