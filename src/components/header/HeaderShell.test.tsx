import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StoreIdentityDeliveryPromise, StoreIdentityLogo } from '@/lib/data-source';
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

// Fixture stand-ins for `getStoreIdentity()` output — HeaderShell is a pure
// client component that receives these as props, never fetches them itself.
const TEST_STORE_NAME = 'Test Store';
const TEST_LOGO: StoreIdentityLogo = {
  src: null,
  alt: '',
  fallbackText: TEST_STORE_NAME,
};
const TEST_LOGO_IMAGE: StoreIdentityLogo = {
  src: 'https://249.magento.default/media/logo/stores/1/logo.png',
  alt: 'Test Store logo',
  fallbackText: TEST_STORE_NAME,
};
const TEST_DELIVERY_PROMISE: StoreIdentityDeliveryPromise = {
  copy: 'Voor 22:00 besteld, morgen in huis',
  cutoffHour: 22,
};

describe('HeaderShell', () => {
  it('renders the logo link home, the search bar, the trust promise, and the account entry point', () => {
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    expect(
      screen.getAllByRole('link', { name: /go to homepage/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('search').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(TEST_DELIVERY_PROMISE.copy)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('leads the nav with the accent Deals shortcut and shows the free-shipping progress + cart', () => {
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        cartCount={0}
        cartTotal={0}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    expect(screen.getByRole('link', { name: /Deals/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Cart/ }).length).toBeGreaterThan(0);
  });

  it('opens the mega-menu for a category and closes it on Escape', () => {
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        megaPromoHtml=""
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mannen' }));
    expect(screen.getByRole('region', { name: /Category menu/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('region', { name: /Category menu/ }),
    ).not.toBeInTheDocument();
  });

  it('includes the mobile hamburger trigger in the markup', () => {
    // The mobile layout is display:none under the desktop-width jsdom viewport
    // (the responsive switch is media-query driven), so query it as hidden.
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Open menu', hidden: true }),
    ).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the full scrolled/active state surface', () => {
    const { container, getByRole } = render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
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
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
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

  it('falls back to the text wordmark when logo.src is null, carrying the .logo class + home-link aria-label', () => {
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    const links = screen.getAllByRole('link', {
      name: `${TEST_STORE_NAME} — go to homepage`,
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveTextContent(TEST_STORE_NAME);
      expect(link.querySelector('img')).not.toBeInTheDocument();
    }
  });

  it('renders the logo IMAGE when logo.src is configured, with the alt text and the home-link aria-label preserved', () => {
    render(
      <HeaderShell
        locale="en"
        categories={categories}
        logo={TEST_LOGO_IMAGE}
        deliveryPromise={TEST_DELIVERY_PROMISE}
      />,
    );
    const links = screen.getAllByRole('link', {
      name: `${TEST_STORE_NAME} — go to homepage`,
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const img = link.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', TEST_LOGO_IMAGE.src as string);
      expect(img).toHaveAttribute('alt', TEST_LOGO_IMAGE.alt);
    }
  });
});
