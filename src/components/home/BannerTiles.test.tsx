import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { BannerTiles } from './BannerTiles';
import type { BannerTile } from '@/lib/home/editorial';

const tiles: BannerTile[] = [
  { title: 'Outlet', body: 'Scherp geprijsd.', href: '/outlet', label: 'Naar de outlet' },
  { title: 'Cadeaus', body: 'Verras iemand.', href: '/cadeaus', label: 'Bekijk' },
];

describe('BannerTiles', () => {
  it('renders nothing for an empty set', () => {
    const { container } = render(<BannerTiles tiles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each tile as a link carrying its heading and copy', () => {
    render(<BannerTiles tiles={tiles} />);
    const link = screen.getByRole('link', { name: /Outlet/ });
    expect(link).toHaveAttribute('href', '/outlet');
    expect(screen.getByRole('heading', { name: 'Outlet' })).toBeInTheDocument();
    expect(screen.getByText('Scherp geprijsd.')).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<BannerTiles tiles={tiles} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
