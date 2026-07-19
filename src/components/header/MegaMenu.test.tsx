import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { MegaMenu } from './MegaMenu';
import type { NavCategory } from './types';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/header/MegaMenu.module.css');

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

describe('MegaMenu', () => {
  const noop = () => {};

  it('renders a left rail of every top-level category', () => {
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml=""
        onClose={noop}
      />,
    );
    expect(screen.getByRole('link', { name: 'Mannen' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vrouwen' })).toBeInTheDocument();
  });

  it('shows the active category subtypes in the middle column', () => {
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml=""
        onClose={noop}
      />,
    );
    const region = screen.getByRole('region', { name: /Mannen/ });
    expect(within(region).getByRole('link', { name: 'Shirts' })).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'Broeken' })).toBeInTheDocument();
  });

  it('switches the active category on hover of a rail item', () => {
    const onActivate = vi.fn();
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={onActivate}
        promoHtml=""
        onClose={noop}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Vrouwen' }));
    expect(onActivate).toHaveBeenCalledWith('20');
  });

  it('renders the sanitized promo bar when CMS content is present', () => {
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml='<a href="/nieuw">Nieuw binnen</a>'
        onClose={noop}
      />,
    );
    const bar = screen.getByTestId('mega-custom-links');
    expect(within(bar).getByRole('link', { name: 'Nieuw binnen' })).toBeInTheDocument();
  });

  it('omits the promo bar when no CMS content is present', () => {
    render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml=""
        onClose={noop}
      />,
    );
    expect(screen.queryByTestId('mega-custom-links')).not.toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml=""
        onClose={noop}
      />,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the active/inactive rail states', () => {
    const { container } = render(
      <MegaMenu
        categories={categories}
        activeId="11"
        onActivate={noop}
        promoHtml=""
        onClose={noop}
      />,
    );
    const links = Array.from(container.querySelectorAll('a'));
    expectBridgePropsConsistent(links, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
