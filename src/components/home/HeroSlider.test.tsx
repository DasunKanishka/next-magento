import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { renderWithBrandTokens, resolvedToken } from '../ui/test-utils/brandRender';
import pagerButtonStyles from '../ui/core/PagerButton.module.css';
import { HeroSlider } from './HeroSlider';
import styles from './HeroSlider.module.css';
import type { HeroSlide } from '@/lib/home/editorial';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/HeroSlider.module.css');

const slides: HeroSlide[] = [
  { title: 'Eerste campagne', body: 'Body een', ctaHref: '/een', ctaLabel: 'Shop een' },
  {
    title: 'Tweede campagne',
    body: 'Body twee',
    ctaHref: '/twee',
    ctaLabel: 'Shop twee',
  },
];

describe('HeroSlider', () => {
  it('renders nothing when there are no panels', () => {
    const { container } = render(<HeroSlider slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first panel with its cta link', () => {
    render(<HeroSlider slides={slides} />);
    expect(screen.getByRole('heading', { name: 'Eerste campagne' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop een' })).toHaveAttribute(
      'href',
      '/een',
    );
  });

  it('advances to the next panel via the dot controls', async () => {
    const user = userEvent.setup();
    render(<HeroSlider slides={slides} />);
    const tablist = screen.getByRole('tablist');
    await user.click(within(tablist).getByRole('tab', { name: 'Campagne 2' }));
    expect(screen.getByRole('heading', { name: 'Tweede campagne' })).toBeInTheDocument();
  });

  it('advances/retreats via the PagerButton prev/next arrows, wrapping at the ends', async () => {
    const user = userEvent.setup();
    render(<HeroSlider slides={slides} />);
    await user.click(screen.getByRole('button', { name: 'Volgende campagne' }));
    expect(screen.getByRole('heading', { name: 'Tweede campagne' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Volgende campagne' }));
    expect(screen.getByRole('heading', { name: 'Eerste campagne' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vorige campagne' }));
    expect(screen.getByRole('heading', { name: 'Tweede campagne' })).toBeInTheDocument();
  });

  it('paging controls are the on-brand PagerButton variant', () => {
    render(<HeroSlider slides={slides} />);
    const prev = screen.getByRole('button', { name: 'Vorige campagne' });
    const next = screen.getByRole('button', { name: 'Volgende campagne' });
    expect(prev.className).toContain(pagerButtonStyles.onBrand);
    expect(prev.className).toContain(pagerButtonStyles.prev);
    expect(next.className).toContain(pagerButtonStyles.onBrand);
    expect(next.className).toContain(pagerButtonStyles.next);
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<HeroSlider slides={slides} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('carries its module classes on the headline and stage', () => {
    render(<HeroSlider slides={slides} />);
    const heading = screen.getByRole('heading', { name: 'Eerste campagne' });
    expect(heading.className).toContain(styles.headline);
    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain(styles.tablist);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent across the active/inactive dot surface (both states render together)', () => {
    const { container } = renderWithBrandTokens(<HeroSlider slides={slides} />);
    // Scoped to the dot tabs (`[role="tab"]`) rather than a bare `button`
    // selector: the paging arrows are now `PagerButton` (composing
    // `IconButton`), which sets its own --local-* bridge consumed by
    // IconButton.module.css, not this stylesheet — including those buttons
    // here would flag their bridge props as "dead" against HeroSlider's own
    // module CSS. See PagerButton.test.tsx for its own bridge-consistency
    // check, cross-referenced against IconButton.module.css.
    const elements = Array.from(container.querySelectorAll('[role="tab"], a, div, span'));
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('token-swap: each dot binds its fill to a token through the bridge', () => {
    // jsdom resolves inline custom properties but does NOT substitute var()
    // into consumers, so the environment-independent proof is that the bridge
    // property each dot sets is itself a token reference (never a raw literal):
    // the active dot's fill is bound to --color-cta, the inactive dot's to
    // --color-border-field. A brand override of either token therefore reaches
    // the painted fill.
    renderWithBrandTokens(<HeroSlider slides={slides} />);
    const tablist = screen.getByRole('tablist');
    const activeDot = within(tablist).getByRole('tab', { selected: true });
    const inactiveDot = within(tablist).getByRole('tab', { selected: false });
    expect(resolvedToken(activeDot, '--local-dot-bg')).toBe('var(--color-cta)');
    expect(resolvedToken(inactiveDot, '--local-dot-bg')).toBe(
      'var(--color-border-field)',
    );
  });
});
