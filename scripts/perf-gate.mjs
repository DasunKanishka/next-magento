// @ts-check
/**
 * Performance + Core Web Vitals release gate for the storefront home page.
 *
 * Runs a Lighthouse mobile-preset lab pass (Moto G Power emulation, 4x CPU
 * throttle, simulated slow-4G — Lighthouse's default mobile config) against a
 * PRODUCTION server, then a real-browser interaction trace that measures INP
 * from actual event timings. It is a DISTINCT capture from the functional /
 * layout Playwright suite (`pnpm test:e2e`): the two are never one signal.
 *
 * Thresholds (all must hold or the process exits non-zero):
 *   - Performance   >= 90
 *   - Accessibility >= 90
 *   - LCP  < 2500 ms          (Lighthouse lab)
 *   - CLS  < 0.1              (Lighthouse lab; a breach is a HARD RELEASE BLOCKER)
 *   - TBT  green band         (Lighthouse lab; INP lab proxy — score >= 0.9)
 *   - INP  < 200 ms           (scripted real-browser interaction trace)
 *
 * Results (scores + LCP/INP/CLS/TBT numbers) are written to a durable JSON +
 * Markdown report under `lighthouse-report/` so the numbers stay auditable
 * after the run, not just a console pass/fail line.
 *
 * The storefront hides behind a server-side consent gate, so both passes send a
 * valid consent cookie (mirroring the E2E helper) to reach the assembled home.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const REPORT_DIR = resolve(REPO_ROOT, 'lighthouse-report');

const CHROME_PATH = chromium.executablePath();
const LOCALE_PATH = '/nl';
const CONSENT_COOKIE_NAME = 'nbns_gate';

// Thresholds — the release bar. Keep in one place so the report can echo them.
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  lcpMs: 2500,
  cls: 0.1,
  tbtScore: 0.9, // Lighthouse green band for Total Blocking Time.
  inpMs: 200,
};

/** Builds the consent cookie value the server accepts (base64url JSON payload). */
function consentCookieValue(country = 'NL') {
  const payload = JSON.stringify({ country, ageConfirmed: true, ts: Date.now() });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

/** Poll an HTTP URL until it answers (any status) or the deadline passes. */
async function waitForHttp(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await fetch(url, { redirect: 'manual' });
      return;
    } catch {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${url}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/**
 * Starts `next start` on the given port against a production build, unless a
 * server is already reachable at the URL. Returns a teardown fn.
 */
async function ensureServer(url, port) {
  try {
    await fetch(url, { redirect: 'manual' });
    console.log(`Reusing an already-running server at ${url}`);
    return async () => {};
  } catch {
    // Not running — spawn one.
  }

  console.log(`Starting a production server on port ${port} ...`);
  const child = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      // Trust the OS cert store so SSR reads the HTTPS backend (mkcert CA),
      // mirroring the dev/e2e setup.
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  await waitForHttp(url);
  return async () => {
    child.kill('SIGTERM');
    // Give it a moment to release the port.
    await new Promise((r) => setTimeout(r, 500));
  };
}

/** Runs the Lighthouse mobile-preset lab pass and returns the parsed report. */
async function runLighthouse(url) {
  const chrome = await launch({
    chromePath: CHROME_PATH,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
  try {
    const runnerResult = await lighthouse(
      url,
      {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility'],
        // Reach the gated home page: send the consent cookie on every request.
        extraHeaders: { Cookie: `${CONSENT_COOKIE_NAME}=${consentCookieValue()}` },
      },
      // Default config == mobile preset (Moto G Power, 4x CPU, simulated 4G).
      undefined,
    );
    if (!runnerResult) throw new Error('Lighthouse returned no result');
    return runnerResult.lhr;
  } finally {
    await chrome.kill();
  }
}

/**
 * Drives real interactions in a browser and returns the worst interaction
 * latency observed (an INP proxy read from `event` PerformanceEntry durations
 * with a non-zero `interactionId`).
 */
async function measureInp(url) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addCookies([
      { name: CONSENT_COOKIE_NAME, value: consentCookieValue(), url },
    ]);
    const page = await context.newPage();

    // Install the observers before any script runs so nothing is missed.
    await page.addInitScript(() => {
      // @ts-expect-error test-only global
      window.__interactionMax = 0;
      // @ts-expect-error test-only global
      window.__lcpElement = 'unknown';
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only entries tied to a real user interaction carry an interactionId.
          const e = /** @type {PerformanceEventTiming} */ (entry);
          if (e.interactionId && e.duration) {
            // @ts-expect-error test-only global
            window.__interactionMax = Math.max(window.__interactionMax, e.duration);
          }
        }
      });
      obs.observe({ type: 'event', durationThreshold: 16, buffered: true });

      // Capture the Largest Contentful Paint element so the report can state
      // whether the LCP candidate is an image (and thus needs `priority`).
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        // @ts-expect-error LargestContentfulPaint.element is not in the DOM lib
        const el = last && last.element;
        if (el) {
          const tag = el.tagName.toLowerCase();
          const cls = el.getAttribute('class');
          // @ts-expect-error test-only global
          window.__lcpElement = `${tag}${cls ? '.' + cls.split(' ')[0] : ''}: ${(el.textContent ?? '').trim().slice(0, 40)}`;
        }
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    // A representative spread of the page's interactions. Each is a discrete
    // input the observer times; the worst of them is the reported INP.
    const nav = page.getByRole('navigation', { name: 'Hoofdnavigatie' });

    // Open the country/language selector and pick an option-less toggle.
    const selector = page.getByRole('button', { name: /Bezorgland/ }).first();
    if (await selector.isVisible().catch(() => false)) {
      await selector.click();
      await page.keyboard.press('Escape');
    }

    // Hover/click a top-level nav trigger (mega-menu open) on desktop-ish width.
    const firstNavBtn = nav.getByRole('button').first();
    if (await firstNavBtn.isVisible().catch(() => false)) {
      await firstNavBtn.click();
      await page.waitForTimeout(50);
    }

    // Type into the search field (keydown/input/keyup interaction).
    const search = page.getByRole('searchbox').first();
    if (await search.isVisible().catch(() => false)) {
      await search.click();
      await search.type('gin', { delay: 30 });
    }

    // Advance a merchandising carousel if present.
    const nextBtn = page
      .getByRole('button', { name: /Volgende|Volgende campagne/ })
      .first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }

    // Give the observer a tick to flush the final entries.
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => ({
      // @ts-expect-error test-only global
      inpMs: window.__interactionMax,
      // @ts-expect-error test-only global
      lcpElement: window.__lcpElement,
    }));
    return result;
  } finally {
    await browser.close();
  }
}

function fmt(n, digits = 0) {
  return Number.isFinite(n) ? n.toFixed(digits) : 'n/a';
}

async function main() {
  const port = Number(process.env.PERF_PORT ?? 3100);
  const url = process.env.PERF_URL ?? `http://localhost:${port}${LOCALE_PATH}`;
  const origin = new URL(url).origin;

  const teardown = await ensureServer(origin, port);
  let lhr;
  let inpMs;
  let lcpElement = 'unknown';
  try {
    console.log('Running Lighthouse (mobile preset) ...');
    lhr = await runLighthouse(url);
    console.log('Measuring INP via a real-browser interaction trace ...');
    const trace = await measureInp(url);
    inpMs = trace.inpMs;
    lcpElement = trace.lcpElement;
  } finally {
    await teardown();
  }

  const perf = Math.round((lhr.categories.performance.score ?? 0) * 100);
  const a11y = Math.round((lhr.categories.accessibility.score ?? 0) * 100);
  const lcpMs = lhr.audits['largest-contentful-paint'].numericValue ?? Infinity;
  const cls = lhr.audits['cumulative-layout-shift'].numericValue ?? Infinity;
  const tbtMs = lhr.audits['total-blocking-time'].numericValue ?? Infinity;
  const tbtScore = lhr.audits['total-blocking-time'].score ?? 0;

  const a11yFailures = Object.values(lhr.audits).filter(
    (a) =>
      a.scoreDisplayMode === 'binary' && a.score === 0 && a.id !== 'errors-in-console',
  );

  // Evaluate each threshold.
  const checks = [
    { name: 'Performance >= 90', pass: perf >= THRESHOLDS.performance, actual: perf },
    {
      name: 'Accessibility >= 90',
      pass: a11y >= THRESHOLDS.accessibility,
      actual: a11y,
    },
    { name: 'LCP < 2500ms', pass: lcpMs < THRESHOLDS.lcpMs, actual: `${fmt(lcpMs)}ms` },
    {
      name: 'CLS < 0.1 (HARD RELEASE BLOCKER)',
      pass: cls < THRESHOLDS.cls,
      actual: fmt(cls, 3),
      hardBlocker: true,
    },
    {
      name: 'TBT green band (INP lab proxy, score >= 0.9)',
      pass: tbtScore >= THRESHOLDS.tbtScore,
      actual: `${fmt(tbtMs)}ms (score ${fmt(tbtScore, 2)})`,
    },
    {
      name: 'INP < 200ms (interaction trace)',
      pass: inpMs < THRESHOLDS.inpMs,
      actual: `${fmt(inpMs)}ms`,
    },
  ];

  const summary = {
    generatedAt: new Date().toISOString(),
    url,
    thresholds: THRESHOLDS,
    scores: { performance: perf, accessibility: a11y },
    coreWebVitals: {
      lcpMs: Number(fmt(lcpMs)),
      cls: Number(fmt(cls, 3)),
      tbtMs: Number(fmt(tbtMs)),
      tbtScore: Number(fmt(tbtScore, 2)),
      inpMs: Number(fmt(inpMs)),
    },
    lcpElement,
    checks,
    clsHardBlockerTripped: cls >= THRESHOLDS.cls,
    passed: checks.every((c) => c.pass),
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(
    resolve(REPORT_DIR, 'home-mobile.lhr.json'),
    JSON.stringify(lhr, null, 2),
  );
  writeFileSync(
    resolve(REPORT_DIR, 'gate-summary.json'),
    JSON.stringify(summary, null, 2),
  );

  const md = [
    '# Home page — performance / Core Web Vitals release gate',
    '',
    `Generated: ${summary.generatedAt}`,
    `URL: ${url}`,
    `LCP element: \`${lcpElement}\``,
    '',
    '| Metric | Threshold | Actual | Verdict |',
    '| --- | --- | --- | --- |',
    `| Performance | >= ${THRESHOLDS.performance} | ${perf} | ${perf >= THRESHOLDS.performance ? 'PASS' : 'FAIL'} |`,
    `| Accessibility | >= ${THRESHOLDS.accessibility} | ${a11y} | ${a11y >= THRESHOLDS.accessibility ? 'PASS' : 'FAIL'} |`,
    `| LCP | < ${THRESHOLDS.lcpMs}ms | ${fmt(lcpMs)}ms | ${lcpMs < THRESHOLDS.lcpMs ? 'PASS' : 'FAIL'} |`,
    `| CLS | < ${THRESHOLDS.cls} | ${fmt(cls, 3)} | ${cls < THRESHOLDS.cls ? 'PASS' : 'FAIL (HARD RELEASE BLOCKER)'} |`,
    `| TBT (INP lab proxy) | green (score >= ${THRESHOLDS.tbtScore}) | ${fmt(tbtMs)}ms / ${fmt(tbtScore, 2)} | ${tbtScore >= THRESHOLDS.tbtScore ? 'PASS' : 'FAIL'} |`,
    `| INP (interaction trace) | < ${THRESHOLDS.inpMs}ms | ${fmt(inpMs)}ms | ${inpMs < THRESHOLDS.inpMs ? 'PASS' : 'FAIL'} |`,
    '',
    summary.passed ? '**GATE: PASS**' : '**GATE: FAIL**',
    '',
  ];
  if (!summary.passed && a11yFailures.length > 0) {
    md.push('## Failing Lighthouse accessibility audits');
    for (const a of a11yFailures) md.push(`- ${a.id}: ${a.title}`);
    md.push('');
  }
  writeFileSync(resolve(REPORT_DIR, 'gate-summary.md'), md.join('\n'));

  // Console output.
  console.log('\n==== HOME PERF / CWV GATE ====');
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} -> ${c.actual}`);
  }
  console.log(`  LCP element: ${lcpElement}`);
  if (summary.clsHardBlockerTripped) {
    console.error('  !! CLS >= 0.1 — HARD RELEASE-BLOCKING FAILURE !!');
  }
  if (!summary.passed && a11yFailures.length > 0) {
    console.error('  Failing a11y audits:');
    for (const a of a11yFailures) console.error(`    - ${a.id}: ${a.title}`);
  }
  console.log(`  Report: lighthouse-report/gate-summary.{json,md}`);
  console.log(`==== GATE ${summary.passed ? 'PASS' : 'FAIL'} ====\n`);

  process.exit(summary.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
