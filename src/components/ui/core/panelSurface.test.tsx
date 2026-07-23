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
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import panelStyles from './panelSurface.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/panelSurface.module.css',
);
const CSS_TEXT = readFileSync(MODULE_CSS_PATH, 'utf8');

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

const categories: NavCategory[] = [
  { id: '11', name: 'Mannen', urlPath: 'mannen', children: [] },
  { id: '20', name: 'Vrouwen', urlPath: 'vrouwen', children: [] },
];

/**
 * Pulls the declaration block of a single top-level rule out of the raw CSS
 * text, so a test can assert on exactly what that rule declares without a
 * full CSS parser.
 */
function ruleBody(cssText: string, selector: string): string {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(withoutComments);
  if (!match) {
    throw new Error(`rule .${selector} not found in CSS text`);
  }
  return match[1];
}

describe('panelSurface (shared dropdown-panel surface)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('is headless of layout — declares ONLY the 4 shared surface tokens', () => {
    const body = ruleBody(CSS_TEXT, 'panelSurface');
    const declaredProps = Array.from(body.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
    expect(declaredProps).toEqual([
      'background',
      'border',
      'border-radius',
      'box-shadow',
    ]);
    expect(body).toMatch(/background:\s*var\(--color-surface\)/);
    expect(body).toMatch(
      /border:\s*var\(--border-width-default\)\s+solid\s+var\(--color-border-card\)/,
    );
    expect(body).toMatch(/border-radius:\s*var\(--radius-lg\)/);
    expect(body).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
  });

  // (b) bridge-consistency: N/A. panelSurface sets no --local-* bridge
  // property — every declaration is a static var(--token) reference consumed
  // directly by each consumer's composed rule — so there is no bridge surface
  // to cross-check in either direction.
  it('sets no --local-* bridge property (nothing to cross-check)', () => {
    expect(CSS_TEXT).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability
  it('every one of the 4 surface tokens is independently overridable', () => {
    const base = renderWithBrandTokens(
      <div data-testid="surf" className={panelStyles.panelSurface} />,
    );
    const baseEl = base.getByTestId('surf');
    expect(resolvedToken(baseEl, '--color-surface')).toBe(
      defaultTokens['--color-surface'],
    );
    expect(resolvedToken(baseEl, '--color-border-card')).toBe(
      defaultTokens['--color-border-card'],
    );
    expect(resolvedToken(baseEl, '--radius-lg')).toBe(defaultTokens['--radius-lg']);
    expect(resolvedToken(baseEl, '--shadow-overlay')).toBe(
      defaultTokens['--shadow-overlay'],
    );
    base.unmount();

    const overrides = {
      '--color-surface': 'rgb(1, 2, 3)',
      '--color-border-card': 'rgb(4, 5, 6)',
      '--radius-lg': '7px',
      '--shadow-overlay': '0 0 0 rgb(7, 8, 9)',
    };
    const over = renderWithBrandTokens(
      <div data-testid="surf-over" className={panelStyles.panelSurface} />,
      overrides,
    );
    const overEl = over.getByTestId('surf-over');
    expect(resolvedToken(overEl, '--color-surface')).toBe(overrides['--color-surface']);
    expect(resolvedToken(overEl, '--color-border-card')).toBe(
      overrides['--color-border-card'],
    );
    expect(resolvedToken(overEl, '--radius-lg')).toBe(overrides['--radius-lg']);
    expect(resolvedToken(overEl, '--shadow-overlay')).toBe(overrides['--shadow-overlay']);
  });

  // (d) className-wiring — each of the 3 consumers composes the shared class
  // onto its own panel/nav rule, so the rendered element must carry both.
  it('CountrySelector composes the shared surface onto its dropdown panel', () => {
    render(<CountrySelector value="NL" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    expect(screen.getByRole('menu').className).toContain(panelStyles.panelSurface);
  });

  it('MegaMenu composes the shared surface onto its panel', () => {
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={() => {}}
        promoHtml=""
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('region').className).toContain(panelStyles.panelSurface);
  });

  it('MobileMenu composes the shared surface onto its drawer nav', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Main menu' }).className).toContain(
      panelStyles.panelSurface,
    );
  });
});
