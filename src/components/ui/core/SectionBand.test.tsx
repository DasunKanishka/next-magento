import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import type { BusinessReviewsContent } from '@/lib/home/editorial';
import { BusinessReviews } from '@/components/home/BusinessReviews';
import { SeoContent } from '@/components/home/SeoContent';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import sectionBandStyles from './SectionBand.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/SectionBand.module.css',
);
const CSS_TEXT = readFileSync(MODULE_CSS_PATH, 'utf8');

vi.mock('@/lib/home/home-data', () => ({
  getSlotProducts: vi.fn(async () => []),
}));

/**
 * Pulls the declaration block of a single top-level rule out of the raw CSS
 * text, so a test can assert on exactly what that rule declares without a
 * full CSS parser (mirrors panelSurface.test.tsx / Surface.test.tsx's helper
 * of the same name).
 */
function ruleBody(cssText: string, selector: string): string {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(withoutComments);
  if (!match) {
    throw new Error(`rule .${selector} not found in CSS text`);
  }
  return match[1];
}

const reviewsContent: BusinessReviewsContent = {
  score: '',
  basis: '',
  testimonials: [{ quote: 'Snelle levering.', author: 'Marieke, Utrecht' }],
};

describe('SectionBand (shared tinted section shape)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('is a pure shape — .band declares ONLY radius + fluid padding, each variant composes band and adds ONLY background', () => {
    const bandBody = ruleBody(CSS_TEXT, 'band');
    const bandProps = Array.from(bandBody.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
    expect(bandProps).toEqual(['border-radius', 'padding']);
    expect(bandBody).toMatch(/border-radius:\s*var\(--radius-2xl\)/);
    expect(bandBody).toMatch(
      /padding:\s*clamp\(var\(--space-6\),\s*4vw,\s*var\(--space-section\)\)/,
    );

    for (const [variant, bgToken] of [
      ['insetA', '--color-surface-inset-a'],
      ['insetB', '--color-surface-inset-b'],
      ['brand', '--color-brand'],
    ] as const) {
      const body = ruleBody(CSS_TEXT, variant);
      const props = Array.from(body.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
      expect(props).toEqual(['background', 'composes']);
      expect(body).toMatch(/composes:\s*band/);
      expect(body).toMatch(new RegExp(`background:\\s*var\\(${bgToken}\\)`));
    }
  });

  // (b) bridge-consistency: N/A. SectionBand sets no --local-* bridge
  // property — every declaration is a static var(--token) reference consumed
  // directly by each consumer's composed rule — so there is no bridge
  // surface to cross-check in either direction.
  it('sets no --local-* bridge property in any variant (nothing to cross-check)', () => {
    expect(CSS_TEXT).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability
  it('the shared radius + padding tokens are independently overridable via any variant', () => {
    const base = renderWithBrandTokens(
      <div data-testid="band" className={sectionBandStyles.insetA} />,
    );
    const baseEl = base.getByTestId('band');
    expect(resolvedToken(baseEl, '--radius-2xl')).toBe(defaultTokens['--radius-2xl']);
    expect(resolvedToken(baseEl, '--space-6')).toBe(defaultTokens['--space-6']);
    expect(resolvedToken(baseEl, '--space-section')).toBe(
      defaultTokens['--space-section'],
    );
    base.unmount();

    const overrides = {
      '--radius-2xl': '3px',
      '--space-6': '11px',
      '--space-section': '77px',
    };
    const over = renderWithBrandTokens(
      <div data-testid="band-over" className={sectionBandStyles.insetA} />,
      overrides,
    );
    const overEl = over.getByTestId('band-over');
    expect(resolvedToken(overEl, '--radius-2xl')).toBe(overrides['--radius-2xl']);
    expect(resolvedToken(overEl, '--space-6')).toBe(overrides['--space-6']);
    expect(resolvedToken(overEl, '--space-section')).toBe(overrides['--space-section']);
  });

  it.each([
    ['insetA', '--color-surface-inset-a'],
    ['insetB', '--color-surface-inset-b'],
    ['brand', '--color-brand'],
  ] as const)(
    'the %s variant background token is independently overridable',
    (variant, token) => {
      const styleKey = variant as keyof typeof sectionBandStyles;
      const base = renderWithBrandTokens(
        <div data-testid="band" className={sectionBandStyles[styleKey]} />,
      );
      const baseEl = base.getByTestId('band');
      expect(resolvedToken(baseEl, token)).toBe(defaultTokens[token]);
      base.unmount();

      const overrides = { [token]: 'rgb(9, 8, 7)' };
      const over = renderWithBrandTokens(
        <div data-testid="band-over" className={sectionBandStyles[styleKey]} />,
        overrides,
      );
      const overEl = over.getByTestId('band-over');
      expect(resolvedToken(overEl, token)).toBe(overrides[token]);
    },
  );

  // (d) className-wiring — each of the 3 consumers composes the shared band
  // shape onto its own local layout rule, so the rendered element must carry
  // both classes. ProductOfMonth's featured product streams from a
  // per-request read (see ProductOfMonth.test.tsx); the read is mocked above
  // so the shell (and its section className) renders synchronously.
  it('ProductOfMonth composes the insetB variant onto its section', async () => {
    const { ProductOfMonth } = await import('@/components/home/ProductOfMonth');
    const productOfMonthStyles = (
      await import('@/components/home/ProductOfMonth.module.css')
    ).default;
    const { container } = render(
      <ProductOfMonth editorial={{ paragraphs: ['Rijk en kruidig.'] }} />,
    );
    const section = container.querySelector('section');
    expect(section?.className).toContain(productOfMonthStyles.section);
    expect(section?.className).toContain(sectionBandStyles.insetB);
  });

  it('SeoContent composes the insetA variant onto its section', () => {
    const { container } = render(<SeoContent html="<p>x</p>" stats={[]} />);
    const section = container.querySelector('section');
    expect(section?.className).toContain(sectionBandStyles.insetA);
  });

  it('BusinessReviews composes the brand variant onto its section', () => {
    const { container } = render(<BusinessReviews content={reviewsContent} />);
    const section = container.querySelector('section');
    expect(section?.className).toContain(sectionBandStyles.brand);
  });
});
