import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { CountrySelector } from '@/components/ui/i18n/CountrySelector';
import { MegaMenu } from '@/components/header/MegaMenu';
import { MobileMenu } from '@/components/header/MobileMenu';
import type { NavCategory } from '@/components/header/types';
import selectorStyles from '@/components/ui/i18n/selectorShared.module.css';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import eyebrowStyles from './Eyebrow.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Eyebrow.module.css');
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

const categories: NavCategory[] = [
  { id: '11', name: 'Mannen', urlPath: 'mannen', children: [] },
  { id: '20', name: 'Vrouwen', urlPath: 'vrouwen', children: [] },
];

describe('Eyebrow (shared uppercase-tracked label triplet)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('is a pure triplet — declares ONLY the 6 shared type properties, no color/spacing', () => {
    const body = ruleBody(CSS_TEXT, 'eyebrow');
    const props = Array.from(body.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
    expect(props).toEqual([
      'font-family',
      'font-size',
      'font-weight',
      'letter-spacing',
      'line-height',
      'text-transform',
    ]);
    expect(body).toMatch(/font-family:\s*var\(--font-brand\)/);
    expect(body).toMatch(/font-weight:\s*var\(--type-eyebrow-weight\)/);
    expect(body).toMatch(/font-size:\s*var\(--type-eyebrow-size\)/);
    expect(body).toMatch(/line-height:\s*var\(--type-eyebrow-line-height\)/);
    expect(body).toMatch(/letter-spacing:\s*var\(--type-eyebrow-tracking\)/);
    expect(body).toMatch(/text-transform:\s*uppercase/);
  });

  // (b) bridge-consistency: N/A. Eyebrow sets no --local-* bridge property —
  // every declaration is a static var(--token) reference consumed directly by
  // each consumer's composed rule — so there is no bridge surface to
  // cross-check in either direction.
  it('sets no --local-* bridge property (nothing to cross-check)', () => {
    expect(CSS_TEXT).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability
  it('every one of the 5 triplet tokens is independently overridable', () => {
    const base = renderWithBrandTokens(
      <span data-testid="eyebrow" className={eyebrowStyles.eyebrow} />,
    );
    const baseEl = base.getByTestId('eyebrow');
    expect(resolvedToken(baseEl, '--font-brand')).toBe(defaultTokens['--font-brand']);
    expect(resolvedToken(baseEl, '--type-eyebrow-weight')).toBe(
      defaultTokens['--type-eyebrow-weight'],
    );
    expect(resolvedToken(baseEl, '--type-eyebrow-size')).toBe(
      defaultTokens['--type-eyebrow-size'],
    );
    expect(resolvedToken(baseEl, '--type-eyebrow-line-height')).toBe(
      defaultTokens['--type-eyebrow-line-height'],
    );
    expect(resolvedToken(baseEl, '--type-eyebrow-tracking')).toBe(
      defaultTokens['--type-eyebrow-tracking'],
    );
    base.unmount();

    const overrides = {
      '--font-brand': "'Scratch', sans-serif",
      '--type-eyebrow-weight': '900',
      '--type-eyebrow-size': '19px',
      '--type-eyebrow-line-height': '1.44',
      '--type-eyebrow-tracking': '0.33em',
    };
    const over = renderWithBrandTokens(
      <span data-testid="eyebrow-over" className={eyebrowStyles.eyebrow} />,
      overrides,
    );
    const overEl = over.getByTestId('eyebrow-over');
    expect(resolvedToken(overEl, '--font-brand')).toBe(overrides['--font-brand']);
    expect(resolvedToken(overEl, '--type-eyebrow-weight')).toBe(
      overrides['--type-eyebrow-weight'],
    );
    expect(resolvedToken(overEl, '--type-eyebrow-size')).toBe(
      overrides['--type-eyebrow-size'],
    );
    expect(resolvedToken(overEl, '--type-eyebrow-line-height')).toBe(
      overrides['--type-eyebrow-line-height'],
    );
    expect(resolvedToken(overEl, '--type-eyebrow-tracking')).toBe(
      overrides['--type-eyebrow-tracking'],
    );
  });

  // (d) className-wiring — each of the 4 files composes the shared triplet
  // onto its own color/spacing rule.
  it('ProductOfMonth composes the shared triplet onto its eyebrow span', async () => {
    const { ProductOfMonth } = await import('@/components/home/ProductOfMonth');
    const productOfMonthStyles = (
      await import('@/components/home/ProductOfMonth.module.css')
    ).default;
    const { container } = render(
      <ProductOfMonth editorial={{ paragraphs: ['Rijk en kruidig.'] }} />,
    );
    const eyebrow = container.querySelector('span');
    expect(eyebrow?.className).toContain(productOfMonthStyles.eyebrow);
    expect(eyebrow?.className).toContain(eyebrowStyles.eyebrow);
  });

  it('MegaMenu composes the shared triplet onto its middle-column eyebrow', () => {
    const { container } = render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={() => {}}
        promoHtml=""
        onClose={() => {}}
      />,
    );
    const middleEyebrow = container.querySelector(`.${eyebrowStyles.eyebrow}`);
    expect(middleEyebrow).not.toBeNull();
    expect(middleEyebrow?.textContent).toBe('Mannen');
  });

  it('MobileMenu composes the shared triplet onto its "Menu" and "Taal" eyebrows', () => {
    render(<MobileMenu categories={categories} locale="nl" />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu openen' }));
    expect(screen.getByText('Menu').className).toContain(eyebrowStyles.eyebrow);
    expect(screen.getByText('Taal').className).toContain(eyebrowStyles.eyebrow);
  });

  it('selectorShared composes the shared triplet onto triggerLabel and columnHeading', () => {
    render(<CountrySelector value="NL" />);
    expect(screen.getByText('Bezorgen naar').className).toContain(eyebrowStyles.eyebrow);

    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    expect(screen.getByText('Land').className).toContain(eyebrowStyles.eyebrow);
    expect(screen.getByText('Taal').className).toContain(eyebrowStyles.eyebrow);
  });

  it('selectorShared triggerLabel and columnHeading carry their own local color classes', () => {
    expect(selectorStyles.triggerLabel).toBeTruthy();
    expect(selectorStyles.columnHeading).toBeTruthy();
  });
});
