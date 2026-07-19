import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import type { HomeCategory } from '@/lib/home/home-data';
import { CategoryBar } from '@/components/home/CategoryBar';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import sectionHeadingStyles from './SectionHeading.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/SectionHeading.module.css',
);
const CSS_TEXT = readFileSync(MODULE_CSS_PATH, 'utf8');

vi.mock('@/lib/home/home-data', () => ({
  getSlotProducts: vi.fn(async () => []),
}));

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
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

const categories: HomeCategory[] = [{ id: '11', name: 'Wijn', urlPath: 'wijn' }];

describe('SectionHeading (shared section h2)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('is the byte-identical block ProductRail and CategoryBar shared — exactly these 6 declarations', () => {
    const body = ruleBody(CSS_TEXT, 'heading');
    const props = Array.from(body.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
    expect(props).toEqual([
      'color',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'margin',
    ]);
    expect(body).toMatch(/margin:\s*0\s+0\s+var\(--space-4\)/);
    expect(body).toMatch(/font-family:\s*var\(--font-brand\)/);
    expect(body).toMatch(/font-weight:\s*var\(--type-weight-bold\)/);
    expect(body).toMatch(/font-size:\s*var\(--type-h3-size\)/);
    expect(body).toMatch(/line-height:\s*var\(--type-h3-line-height\)/);
    expect(body).toMatch(/color:\s*var\(--color-brand-ink\)/);
  });

  // (b) bridge-consistency: N/A. SectionHeading sets no --local-* bridge
  // property — every declaration is a static var(--token) reference consumed
  // directly by each consumer's composed rule — so there is no bridge
  // surface to cross-check in either direction.
  it('sets no --local-* bridge property (nothing to cross-check)', () => {
    expect(CSS_TEXT).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability
  it('every one of the 5 heading tokens is independently overridable', () => {
    const base = renderWithBrandTokens(
      <h2 data-testid="heading" className={sectionHeadingStyles.heading} />,
    );
    const baseEl = base.getByTestId('heading');
    expect(resolvedToken(baseEl, '--space-4')).toBe(defaultTokens['--space-4']);
    expect(resolvedToken(baseEl, '--font-brand')).toBe(defaultTokens['--font-brand']);
    expect(resolvedToken(baseEl, '--type-weight-bold')).toBe(
      defaultTokens['--type-weight-bold'],
    );
    expect(resolvedToken(baseEl, '--type-h3-size')).toBe(defaultTokens['--type-h3-size']);
    expect(resolvedToken(baseEl, '--type-h3-line-height')).toBe(
      defaultTokens['--type-h3-line-height'],
    );
    expect(resolvedToken(baseEl, '--color-brand-ink')).toBe(
      defaultTokens['--color-brand-ink'],
    );
    base.unmount();

    const overrides = {
      '--space-4': '9px',
      '--font-brand': "'Scratch', sans-serif",
      '--type-weight-bold': '900',
      '--type-h3-size': '31px',
      '--type-h3-line-height': '1.33',
      '--color-brand-ink': 'rgb(1, 2, 3)',
    };
    const over = renderWithBrandTokens(
      <h2 data-testid="heading-over" className={sectionHeadingStyles.heading} />,
      overrides,
    );
    const overEl = over.getByTestId('heading-over');
    expect(resolvedToken(overEl, '--space-4')).toBe(overrides['--space-4']);
    expect(resolvedToken(overEl, '--font-brand')).toBe(overrides['--font-brand']);
    expect(resolvedToken(overEl, '--type-weight-bold')).toBe(
      overrides['--type-weight-bold'],
    );
    expect(resolvedToken(overEl, '--type-h3-size')).toBe(overrides['--type-h3-size']);
    expect(resolvedToken(overEl, '--type-h3-line-height')).toBe(
      overrides['--type-h3-line-height'],
    );
    expect(resolvedToken(overEl, '--color-brand-ink')).toBe(
      overrides['--color-brand-ink'],
    );
  });

  // (d) className-wiring — both consumers compose the shared h2 block onto
  // their own heading. ProductRail's product content streams from a
  // per-request read (see ProductRail.test.tsx); the read is mocked above so
  // the shell (and its heading className) renders synchronously.
  it('ProductRail composes the shared heading onto its h2', async () => {
    const { ProductRail } = await import('@/components/home/ProductRail');
    const productRailStyles = (await import('@/components/home/ProductRail.module.css'))
      .default;
    const { container } = render(
      <ProductRail slot="highlighted" limit={4} heading="Bestsellers" variant="grid" />,
    );
    const h2 = container.querySelector('h2');
    expect(h2?.className).toContain(productRailStyles.heading);
    expect(h2?.className).toContain(sectionHeadingStyles.heading);
  });

  it('CategoryBar composes the shared heading onto its h2', () => {
    render(<CategoryBar categories={categories} />);
    expect(screen.getByRole('heading', { level: 2 }).className).toContain(
      sectionHeadingStyles.heading,
    );
  });
});
