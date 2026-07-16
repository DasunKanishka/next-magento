import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONTRACT_TOKEN_NAMES } from './contract';

/**
 * The resolver validates `NEXT_BRAND` at module-evaluation time (see
 * `resolver.ts`), so each test that varies the env var must reset the module
 * registry and re-import fresh — importing is what triggers (and, for an
 * invalid value, must throw during) the fail-closed check.
 */
const ORIGINAL_NEXT_BRAND = process.env.NEXT_BRAND;

describe('theme resolver — fail-closed brand resolution', () => {
  afterEach(() => {
    if (ORIGINAL_NEXT_BRAND === undefined) {
      delete process.env.NEXT_BRAND;
    } else {
      process.env.NEXT_BRAND = ORIGINAL_NEXT_BRAND;
    }
    vi.resetModules();
  });

  it('throws at import time for an unrecognized NEXT_BRAND value — never a silent unstyled fallback', async () => {
    process.env.NEXT_BRAND = 'invalid-brand';
    vi.resetModules();

    // The throw happens as a side effect of module evaluation, not inside a
    // function call — so merely importing the module must reject. Nothing
    // downstream (a route, a layout render) ever gets a chance to run.
    await expect(import('./resolver')).rejects.toThrow(/NEXT_BRAND/);
  });

  it('throws at import time when NEXT_BRAND is set to an empty string', async () => {
    process.env.NEXT_BRAND = '';
    vi.resetModules();

    await expect(import('./resolver')).rejects.toThrow(/NEXT_BRAND/);
  });

  it('defaults to the "default" brand when NEXT_BRAND is unset, and does not throw', async () => {
    delete process.env.NEXT_BRAND;
    vi.resetModules();

    const { getActiveBrand } = await import('./resolver');
    expect(getActiveBrand()).toBe('default');
  });
});

describe('theme resolver — resolveTokens("default")', () => {
  afterEach(() => {
    if (ORIGINAL_NEXT_BRAND === undefined) {
      delete process.env.NEXT_BRAND;
    } else {
      process.env.NEXT_BRAND = ORIGINAL_NEXT_BRAND;
    }
    vi.resetModules();
  });

  it('returns every contract key with a non-empty value — zero missing or undefined', async () => {
    delete process.env.NEXT_BRAND;
    vi.resetModules();
    const { resolveTokens } = await import('./resolver');

    const sheet = resolveTokens('default');
    const keys = Object.keys(sheet);

    // The parent contract declares 166 distinct CSS custom-property keys once
    // every grouped source-table row (e.g. a type-scale step's
    // -size/-weight/-line-height, or the space-1..8 scale) is expanded into
    // its independently-settable properties — see contract.ts's reconciliation
    // note for why this is 166 (the source palette's 93, the
    // accessibility-driven --color-premium-accent-ink, the 25 gaps closed
    // by the token-scale-coverage addendum, the standalone caption-size
    // addendum, the 7 button-literal promotions of the interactive-surface
    // & disabled-pair addendum, the 2 standalone weight primitives of the
    // generic-weight addendum, the 10 header/nav literal-closure
    // promotions, the 10 home literal-closure promotions of the home
    // styling pass, the 5 ui-core/product literal-closure promotions of
    // the ui-core/product styling pass, and the 12 footer/i18n/forms/
    // feedback/gate literal-closure promotions of the final styling pass),
    // and not the 70 quoted in the source design specification's summary
    // prose (that figure undercounts its own tables by one row apiece in the
    // color and typography sections). Asserting against
    // CONTRACT_TOKEN_NAMES.length (rather than a bare literal) keeps this
    // test honest if the contract ever changes.
    expect(CONTRACT_TOKEN_NAMES.length).toBe(166);
    expect(keys.length).toBe(CONTRACT_TOKEN_NAMES.length);
    expect(new Set(keys)).toEqual(new Set(CONTRACT_TOKEN_NAMES));

    for (const key of CONTRACT_TOKEN_NAMES) {
      const value = sheet[key];
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('throws for a brand id with no registered TokenSheet', async () => {
    delete process.env.NEXT_BRAND;
    vi.resetModules();
    const { resolveTokens } = await import('./resolver');

    // @ts-expect-error — deliberately passing an unregistered id to exercise the guard.
    expect(() => resolveTokens('not-a-real-brand')).toThrow(/no TokenSheet registered/);
  });
});
