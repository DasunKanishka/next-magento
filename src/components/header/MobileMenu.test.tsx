import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { MobileMenu } from './MobileMenu';
import type { NavCategory } from './types';

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

const categories: NavCategory[] = [
  {
    id: '11',
    name: 'Mannen',
    urlPath: 'mannen',
    children: [
      { id: '12', name: 'Shirts', urlPath: 'mannen/shirts' },
      { id: '13', name: 'Broeken', urlPath: 'mannen/broeken' },
    ],
  },
  { id: '20', name: 'Vrouwen', urlPath: 'vrouwen', children: [] },
];

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Menu openen' }));
}

describe('MobileMenu', () => {
  it('toggles the drawer from the hamburger trigger', () => {
    render(<MobileMenu categories={categories} locale="nl" />);
    expect(
      screen.queryByRole('navigation', { name: 'Hoofdmenu' }),
    ).not.toBeInTheDocument();
    open();
    expect(screen.getByRole('navigation', { name: 'Hoofdmenu' })).toBeInTheDocument();
  });

  it('leads with the accent Deals entry and lists categories + languages', () => {
    render(<MobileMenu categories={categories} locale="nl" />);
    open();
    const drawer = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    expect(within(drawer).getByRole('link', { name: /Deals/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Vrouwen' })).toBeInTheDocument();
    const langMenu = within(drawer).getByRole('menu', { name: 'Taal' });
    expect(
      within(langMenu).getByRole('menuitemradio', { name: /Nederlands/ }),
    ).toBeChecked();
  });

  it('drills into a category with subtypes and returns via the back control', () => {
    render(<MobileMenu categories={categories} locale="nl" />);
    open();
    fireEvent.click(screen.getByRole('button', { name: /Mannen — submenu openen/ }));
    expect(screen.getByRole('link', { name: 'Alles in Mannen' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shirts' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /terug/ }));
    expect(screen.getByRole('link', { name: 'Vrouwen' })).toBeInTheDocument();
  });

  it('reports the chosen language and closes', () => {
    const onLanguageChange = vi.fn();
    render(
      <MobileMenu
        categories={categories}
        locale="nl"
        onLanguageChange={onLanguageChange}
      />,
    );
    open();
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Frans/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
    expect(
      screen.queryByRole('navigation', { name: 'Hoofdmenu' }),
    ).not.toBeInTheDocument();
  });

  it('closes on Escape and on a backdrop click', () => {
    render(<MobileMenu categories={categories} locale="nl" />);
    open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('navigation', { name: 'Hoofdmenu' }),
    ).not.toBeInTheDocument();
    open();
    fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));
    expect(
      screen.queryByRole('navigation', { name: 'Hoofdmenu' }),
    ).not.toBeInTheDocument();
  });

  it('emits only real contract tokens when open', () => {
    const { container } = render(<MobileMenu categories={categories} locale="nl" />);
    open();
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
