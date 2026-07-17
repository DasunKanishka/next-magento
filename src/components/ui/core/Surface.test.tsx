import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import type { BannerTile } from '@/lib/home/editorial';
import type { BusinessReviewsContent } from '@/lib/home/editorial';
import { BannerTiles } from '@/components/home/BannerTiles';
import { BusinessReviews } from '@/components/home/BusinessReviews';
import { SeoContent } from '@/components/home/SeoContent';
import { Toast } from '@/components/ui/feedback/Toast';
import { ProductCard } from '@/components/ui/product/ProductCard';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import surfaceStyles from './Surface.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Surface.module.css');
const CSS_TEXT = readFileSync(MODULE_CSS_PATH, 'utf8');

/**
 * Pulls the declaration block of a single top-level rule out of the raw CSS
 * text, so a test can assert on exactly what that rule declares without a
 * full CSS parser (mirrors panelSurface.test.tsx's helper of the same name).
 */
function ruleBody(cssText: string, selector: string): string {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(withoutComments);
  if (!match) {
    throw new Error(`rule .${selector} not found in CSS text`);
  }
  return match[1];
}

const tiles: BannerTile[] = [
  { title: 'Outlet', body: 'Scherp geprijsd.', href: '/outlet', label: 'Naar de outlet' },
];

const reviewsContent: BusinessReviewsContent = {
  score: '',
  basis: '',
  testimonials: [{ quote: 'Snelle levering.', author: 'Marieke, Utrecht' }],
};

describe('Surface (shared bordered-shell primitive)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('is a pure shell — each variant declares ONLY background/border/border-radius', () => {
    const onSurfaceBody = ruleBody(CSS_TEXT, 'onSurface');
    const onSurfaceProps = Array.from(
      onSurfaceBody.matchAll(/([a-z-]+)\s*:/g),
      (m) => m[1],
    ).sort();
    expect(onSurfaceProps).toEqual(['background', 'border', 'border-radius']);
    expect(onSurfaceBody).toMatch(/background:\s*var\(--color-surface\)/);
    expect(onSurfaceBody).toMatch(
      /border:\s*var\(--border-width-default\)\s+solid\s+var\(--color-border-card\)/,
    );
    expect(onSurfaceBody).toMatch(/border-radius:\s*var\(--radius-lg\)/);

    const onBrandBody = ruleBody(CSS_TEXT, 'onBrand');
    const onBrandProps = Array.from(
      onBrandBody.matchAll(/([a-z-]+)\s*:/g),
      (m) => m[1],
    ).sort();
    expect(onBrandProps).toEqual(['background', 'border', 'border-radius']);
    expect(onBrandBody).toMatch(/background:\s*var\(--color-surface-on-brand\)/);
    expect(onBrandBody).toMatch(/border:\s*none/);
    expect(onBrandBody).toMatch(/border-radius:\s*var\(--radius-lg\)/);
  });

  // (b) bridge-consistency: N/A for either variant. Surface sets no --local-*
  // bridge property — every declaration in both rules is a static
  // var(--token) reference consumed directly by each consumer's composed
  // rule — so there is no bridge surface to cross-check in either direction.
  it('sets no --local-* bridge property in either variant (nothing to cross-check)', () => {
    expect(CSS_TEXT).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability — both variants
  it('every on-surface token is independently overridable', () => {
    const base = renderWithBrandTokens(
      <div data-testid="surf" className={surfaceStyles.onSurface} />,
    );
    const baseEl = base.getByTestId('surf');
    expect(resolvedToken(baseEl, '--color-surface')).toBe(
      defaultTokens['--color-surface'],
    );
    expect(resolvedToken(baseEl, '--color-border-card')).toBe(
      defaultTokens['--color-border-card'],
    );
    expect(resolvedToken(baseEl, '--radius-lg')).toBe(defaultTokens['--radius-lg']);
    base.unmount();

    const overrides = {
      '--color-surface': 'rgb(1, 2, 3)',
      '--color-border-card': 'rgb(4, 5, 6)',
      '--radius-lg': '7px',
    };
    const over = renderWithBrandTokens(
      <div data-testid="surf-over" className={surfaceStyles.onSurface} />,
      overrides,
    );
    const overEl = over.getByTestId('surf-over');
    expect(resolvedToken(overEl, '--color-surface')).toBe(overrides['--color-surface']);
    expect(resolvedToken(overEl, '--color-border-card')).toBe(
      overrides['--color-border-card'],
    );
    expect(resolvedToken(overEl, '--radius-lg')).toBe(overrides['--radius-lg']);
  });

  it('every on-brand token is independently overridable', () => {
    const base = renderWithBrandTokens(
      <div data-testid="surf" className={surfaceStyles.onBrand} />,
    );
    const baseEl = base.getByTestId('surf');
    expect(resolvedToken(baseEl, '--color-surface-on-brand')).toBe(
      defaultTokens['--color-surface-on-brand'],
    );
    expect(resolvedToken(baseEl, '--radius-lg')).toBe(defaultTokens['--radius-lg']);
    base.unmount();

    const overrides = {
      '--color-surface-on-brand': 'rgb(9, 8, 7)',
      '--radius-lg': '11px',
    };
    const over = renderWithBrandTokens(
      <div data-testid="surf-over" className={surfaceStyles.onBrand} />,
      overrides,
    );
    const overEl = over.getByTestId('surf-over');
    expect(resolvedToken(overEl, '--color-surface-on-brand')).toBe(
      overrides['--color-surface-on-brand'],
    );
    expect(resolvedToken(overEl, '--radius-lg')).toBe(overrides['--radius-lg']);
  });

  // (d) className-wiring — each of the 5 consumers composes the shared shell
  // onto its own local rule, so the rendered element must carry both classes.
  it('ProductCard composes the on-surface shell onto its card', () => {
    const { container } = render(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} />,
    );
    expect(container.querySelector('div')?.className).toContain(surfaceStyles.onSurface);
  });

  it('BannerTiles composes the on-surface shell onto each tile card', () => {
    render(<BannerTiles tiles={tiles} />);
    expect(screen.getByRole('link', { name: /Outlet/ }).className).toContain(
      surfaceStyles.onSurface,
    );
  });

  it('Toast composes the on-surface shell onto the pill', () => {
    const { container } = render(<Toast tone="success">Gelukt</Toast>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      surfaceStyles.onSurface,
    );
  });

  it('SeoContent composes the on-surface shell onto each stat item', () => {
    const { container } = render(<SeoContent html="<p>x</p>" />);
    expect(container.querySelector('li')?.className).toContain(surfaceStyles.onSurface);
  });

  it('BusinessReviews composes the on-brand shell onto each testimonial', () => {
    const { container } = render(<BusinessReviews content={reviewsContent} />);
    expect(container.querySelector('figure')?.className).toContain(surfaceStyles.onBrand);
  });
});
