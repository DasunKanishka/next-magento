import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { seedConsent } from './helpers';

/**
 * Real-browser accessibility gate for the assembled storefront. Unlike the
 * jsdom component scan, this runs in Chromium so the two rules that need real
 * layout + paint — `color-contrast` (pixel sampling) and `target-size`
 * (computed geometry) — are actually evaluated; both are explicitly enabled
 * below. The bar is zero critical/serious violations on the fully rendered home
 * (header, footer, and all sections) and on the consent gate.
 *
 * A separate automated bounding-box check confirms every interactive tap target
 * is at least 44x44 CSS px (stricter than the 24px WCAG target-size rule).
 *
 * Results (violation counts + any tap-target shortfalls) are written to a
 * durable report so the numbers stay auditable after the run.
 */

const REPORT_DIR = resolve(process.cwd(), 'a11y-report');
const TAP_MIN = 44;
const GATE_TITLE = 'Waar mogen we naartoe bezorgen?';

/** Both rules are off in the jsdom unit scan; here they are forced on. */
const AXE_OPTIONS = {
  rules: {
    'color-contrast': { enabled: true },
    'target-size': { enabled: true },
  },
} as const;

function writeReport(name: string, data: unknown) {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(resolve(REPORT_DIR, name), JSON.stringify(data, null, 2));
}

type AxeViolation = {
  id: string;
  impact: string | null | undefined;
  description: string;
  nodes: { html: string; failureSummary?: string }[];
};

/** Runs axe, writes a report, and asserts zero critical/serious violations. */
async function scanAndAssert(page: Page, label: string, reportFile: string) {
  const results = await new AxeBuilder({ page }).options(AXE_OPTIONS).analyze();

  const criticalOrSerious = (results.violations as AxeViolation[]).filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  writeReport(reportFile, {
    label,
    scannedAt: new Date().toISOString(),
    url: page.url(),
    rulesForced: ['color-contrast', 'target-size'],
    totalViolations: results.violations.length,
    criticalOrSeriousCount: criticalOrSerious.length,
    criticalOrSerious: criticalOrSerious.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodeCount: v.nodes.length,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        failureSummary: n.failureSummary,
      })),
    })),
    allViolationIds: results.violations.map((v) => v.id),
  });

  const detail = criticalOrSerious
    .map((v) => `[${v.impact}] ${v.id} (${v.nodes.length} node(s)): ${v.description}`)
    .join('\n');
  expect(criticalOrSerious, `axe critical/serious on ${label}:\n${detail}`).toEqual([]);
}

/**
 * Measures every interactive control's effective tap target in the browser.
 * For a visually-hidden or under-sized form input, the enclosing <label> is the
 * real target, so its box is measured instead. Returns the shortfalls.
 */
async function measureTapTargets(page: Page, scopeSelector: string) {
  return page.evaluate(
    ({ min, scopeSel }) => {
      const scope = document.querySelector(scopeSel) ?? document.body;
      const selector =
        'button, a[href], [role="tab"], [role="menuitemradio"], input:not([type="hidden"]), select, textarea';
      const nodes = Array.from(scope.querySelectorAll<HTMLElement>(selector));

      const isVisible = (el: HTMLElement) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return true;
      };

      type Entry = { tag: string; text: string; w: number; h: number; display: string };
      const shortfalls: Entry[] = [];
      const exempt: Entry[] = [];
      const measured: Entry[] = [];

      for (const el of nodes) {
        if (!isVisible(el)) continue;

        let target: HTMLElement = el;
        let rect = el.getBoundingClientRect();
        const display = getComputedStyle(el).display;

        // A visually-hidden or sub-target-size input delegates its tap area to
        // its wrapping label (the pattern the gate uses).
        const tag = el.tagName.toLowerCase();
        if (tag === 'input' && (rect.width < min || rect.height < min)) {
          const label = el.closest('label');
          if (label) {
            target = label as HTMLElement;
            rect = label.getBoundingClientRect();
          }
        }

        // Skip zero-area nodes (not laid out / detached).
        if (rect.width === 0 && rect.height === 0) continue;

        const text = (target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const entry: Entry = {
          tag,
          text: text || `[${el.getAttribute('aria-label') ?? tag}]`,
          w: Math.round(rect.width * 10) / 10,
          h: Math.round(rect.height * 10) / 10,
          display,
        };
        measured.push(entry);

        // WCAG exempts links that flow inline within running text (their size is
        // constrained by the surrounding line). A plain `inline` anchor is such
        // a prose link (e.g. inside sanitized editorial copy); standalone
        // control links in this app are all inline-flex/flex/block.
        if (tag === 'a' && display === 'inline') {
          exempt.push(entry);
          continue;
        }

        // Allow a half-pixel of sub-pixel rounding slack.
        if (rect.width < min - 0.5 || rect.height < min - 0.5) shortfalls.push(entry);
      }

      return { measuredCount: measured.length, exempt, shortfalls };
    },
    { min: TAP_MIN, scopeSel: scopeSelector },
  );
}

test.describe('rendered home page', () => {
  test.beforeEach(async ({ context }) => {
    await seedConsent(context);
  });

  test('axe: zero critical/serious with color-contrast + target-size enabled', async ({
    page,
  }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await scanAndAssert(page, 'home', 'axe-home.json');
  });

  test('every interactive control is at least 44x44px', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const { measuredCount, exempt, shortfalls } = await measureTapTargets(
      page,
      '[data-testid="home-page"]',
    );
    writeReport('tap-targets-home.json', {
      scannedAt: new Date().toISOString(),
      min: TAP_MIN,
      measuredCount,
      exemptInlineProseLinks: exempt.length,
      shortfallCount: shortfalls.length,
      shortfalls,
    });

    const detail = shortfalls
      .map((s) => `${s.tag} "${s.text}" = ${s.w}x${s.h}`)
      .join('\n');
    expect(shortfalls, `tap targets under ${TAP_MIN}px:\n${detail}`).toEqual([]);
    expect(measuredCount).toBeGreaterThan(0);
  });
});

test.describe('rendered home page (desktop width)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await seedConsent(context);
  });

  test('axe: zero critical/serious with color-contrast + target-size enabled', async ({
    page,
  }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await scanAndAssert(page, 'home-desktop', 'axe-home-desktop.json');
  });

  test('every interactive control is at least 44x44px', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const { measuredCount, exempt, shortfalls } = await measureTapTargets(
      page,
      '[data-testid="home-page"]',
    );
    writeReport('tap-targets-home-desktop.json', {
      scannedAt: new Date().toISOString(),
      min: TAP_MIN,
      measuredCount,
      exemptInlineProseLinks: exempt.length,
      shortfallCount: shortfalls.length,
      shortfalls,
    });

    const detail = shortfalls
      .map((s) => `${s.tag} "${s.text}" = ${s.w}x${s.h}`)
      .join('\n');
    expect(shortfalls, `tap targets under ${TAP_MIN}px:\n${detail}`).toEqual([]);
    expect(measuredCount).toBeGreaterThan(0);
  });
});

test.describe('rendered home page (dark OS color scheme)', () => {
  // The app is light-only in this version; a viewer whose OS prefers dark must
  // still get the light brand surfaces (not a dark UA background under
  // light-mode tokens). Scanning under an emulated dark scheme guards against
  // that class of contrast regression.
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async ({ context }) => {
    await seedConsent(context);
  });

  test('axe: zero critical/serious with color-contrast + target-size enabled', async ({
    page,
  }) => {
    await page.goto('/nl');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await scanAndAssert(page, 'home-dark', 'axe-home-dark.json');
  });
});

test.describe('consent gate', () => {
  // No consent seeded — the gate is in force.
  test('axe: zero critical/serious with color-contrast + target-size enabled', async ({
    page,
  }) => {
    await page.goto('/nl');
    await expect(page.getByRole('heading', { name: GATE_TITLE })).toBeVisible();
    await scanAndAssert(page, 'gate', 'axe-gate.json');
  });

  test('every gate control is at least 44x44px', async ({ page }) => {
    await page.goto('/nl');
    await expect(page.getByRole('heading', { name: GATE_TITLE })).toBeVisible();

    const { measuredCount, exempt, shortfalls } = await measureTapTargets(page, 'body');
    writeReport('tap-targets-gate.json', {
      scannedAt: new Date().toISOString(),
      min: TAP_MIN,
      measuredCount,
      exemptInlineProseLinks: exempt.length,
      shortfallCount: shortfalls.length,
      shortfalls,
    });

    const detail = shortfalls
      .map((s) => `${s.tag} "${s.text}" = ${s.w}x${s.h}`)
      .join('\n');
    expect(shortfalls, `gate tap targets under ${TAP_MIN}px:\n${detail}`).toEqual([]);
    expect(measuredCount).toBeGreaterThan(0);
  });
});
