import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DELIVERY_DEADLINE_COPY } from '@/config/delivery';
import { renderWithBrandTokens, resolvedToken } from '../ui/test-utils/brandRender';
import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { HeaderShell } from './HeaderShell';
import type { NavCategory } from './types';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/header/HeaderShell.module.css',
);

const replace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const categories: NavCategory[] = [
  {
    id: '11',
    name: 'Mannen',
    urlPath: 'mannen',
    children: [{ id: '12', name: 'Shirts', urlPath: 'mannen/shirts' }],
  },
  { id: '20', name: 'Vrouwen', urlPath: 'vrouwen', children: [] },
];

describe('HeaderShell', () => {
  it('renders the logo link home, the search bar, the trust promise, and the account entry point', () => {
    render(<HeaderShell locale="nl" categories={categories} />);
    expect(
      screen.getAllByRole('link', { name: /naar de homepagina/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('search').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(DELIVERY_DEADLINE_COPY)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Inloggen' })).toBeInTheDocument();
  });

  it('leads the nav with the accent Deals shortcut and shows the free-shipping progress + cart', () => {
    render(
      <HeaderShell locale="nl" categories={categories} cartCount={0} cartTotal={0} />,
    );
    expect(screen.getByRole('link', { name: /Deals/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Winkelmandje/ }).length,
    ).toBeGreaterThan(0);
  });

  it('opens the mega-menu for a category and closes it on Escape', () => {
    render(<HeaderShell locale="nl" categories={categories} megaPromoHtml="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mannen' }));
    expect(screen.getByRole('region', { name: /Categoriemenu/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('region', { name: /Categoriemenu/ }),
    ).not.toBeInTheDocument();
  });

  it('includes the mobile hamburger trigger in the markup', () => {
    // The mobile layout is display:none under the desktop-width jsdom viewport
    // (the responsive switch is media-query driven), so query it as hidden.
    render(<HeaderShell locale="nl" categories={categories} />);
    expect(
      screen.getByRole('button', { name: 'Menu openen', hidden: true }),
    ).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<HeaderShell locale="nl" categories={categories} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the full scrolled/active state surface', () => {
    const { container, getByRole } = render(
      <HeaderShell locale="nl" categories={categories} />,
    );
    const header = container.querySelector('header') as HTMLElement;

    // Exercise every state HeaderShell's own bridge can take — scrolled and
    // not, with a nav trigger active and not — before collecting the union
    // of elements the consistency check needs; a partial render would
    // false-positive a real bridge property as dead.
    fireEvent.click(getByRole('button', { name: 'Mannen' }));
    const activeTrigger = getByRole('button', { name: 'Mannen' });
    const inactiveTrigger = getByRole('button', { name: 'Vrouwen' });
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    fireEvent.scroll(window);

    expectBridgePropsConsistent(
      [header, activeTrigger, inactiveTrigger],
      readFileSync(MODULE_CSS_PATH, 'utf8'),
    );
  });

  it('token-swap: overriding the consumed shadow and nav-trigger-fill tokens reflects across states', () => {
    const overrideShadow = '0 0 0 9px rgb(9, 9, 9)';
    const overrideInsetB = 'rgb(10, 20, 30)';

    // A prior test in this file scrolls the shared jsdom window; reset it so
    // this test starts from the un-scrolled baseline.
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

    const { container, getByRole } = renderWithBrandTokens(
      <HeaderShell locale="nl" categories={categories} />,
      { '--shadow-card': overrideShadow, '--color-surface-inset-b': overrideInsetB },
    );
    const header = container.querySelector('header') as HTMLElement;

    // Baseline: not scrolled, no category active — the bridge carries the
    // inert branch values, not yet a reference to either overridden token.
    expect(header.style.getPropertyValue('--local-shadow')).toBe('none');
    const trigger = getByRole('button', { name: 'Mannen' });
    expect(trigger.style.getPropertyValue('--local-nav-bg')).toBe('transparent');

    // Scrolling flips the header's shadow bridge to the token reference; the
    // override then resolves through it.
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    fireEvent.scroll(window);
    expect(header.style.getPropertyValue('--local-shadow')).toBe('var(--shadow-card)');
    expect(resolvedToken(header, '--shadow-card')).toBe(overrideShadow);

    // Activating the trigger flips its fill bridge the same way; the
    // override resolves there too.
    fireEvent.click(trigger);
    expect(trigger.style.getPropertyValue('--local-nav-bg')).toBe(
      'var(--color-surface-inset-b)',
    );
    expect(resolvedToken(trigger, '--color-surface-inset-b')).toBe(overrideInsetB);
  });
});
