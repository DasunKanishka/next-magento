import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { CategoryBar } from './CategoryBar';
import type { HomeCategory } from '@/lib/home/home-data';

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

const categories: HomeCategory[] = [
  { id: '11', name: 'Wijn', urlPath: 'wijn' },
  { id: '12', name: 'Bier', urlPath: 'bier' },
];

describe('CategoryBar', () => {
  it('renders nothing for an empty tree', () => {
    const { container } = render(<CategoryBar categories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link per category pointing at its path', () => {
    render(<CategoryBar categories={categories} />);
    expect(screen.getByRole('link', { name: 'Wijn' })).toHaveAttribute('href', '/wijn');
    expect(screen.getByRole('link', { name: 'Bier' })).toHaveAttribute('href', '/bier');
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<CategoryBar categories={categories} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
