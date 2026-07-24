import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { MobileMenu } from './MobileMenu';
import type { NavCategory } from './types';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/header/MobileMenu.module.css',
);

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
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
}

describe('MobileMenu', () => {
  it('toggles the drawer from the hamburger trigger', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    expect(
      screen.queryByRole('navigation', { name: 'Main menu' }),
    ).not.toBeInTheDocument();
    open();
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeInTheDocument();
  });

  it('leads with the accent Deals entry and lists categories + languages', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    open();
    const drawer = screen.getByRole('navigation', { name: 'Main menu' });
    expect(within(drawer).getByRole('link', { name: /Deals/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Vrouwen' })).toBeInTheDocument();
    const langMenu = within(drawer).getByRole('menu', { name: 'Language' });
    expect(
      within(langMenu).getByRole('menuitemradio', { name: /English/ }),
    ).toBeChecked();
  });

  it('drills into a category with subtypes and returns via the back control', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    open();
    fireEvent.click(screen.getByRole('button', { name: /Mannen — open submenu/ }));
    expect(screen.getByRole('link', { name: 'All in Mannen' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shirts' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(screen.getByRole('link', { name: 'Vrouwen' })).toBeInTheDocument();
  });

  it('reports the chosen language and closes', () => {
    const onLanguageChange = vi.fn();
    render(
      <MobileMenu
        categories={categories}
        locale="en"
        onLanguageChange={onLanguageChange}
      />,
    );
    open();
    fireEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('en');
    expect(
      screen.queryByRole('navigation', { name: 'Main menu' }),
    ).not.toBeInTheDocument();
  });

  it('closes on Escape and on a backdrop click', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('navigation', { name: 'Main menu' }),
    ).not.toBeInTheDocument();
    open();
    fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));
    expect(
      screen.queryByRole('navigation', { name: 'Main menu' }),
    ).not.toBeInTheDocument();
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
