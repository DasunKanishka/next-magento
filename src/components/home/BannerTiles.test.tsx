import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { BannerTiles } from './BannerTiles';
import styles from './BannerTiles.module.css';
import type { BannerTile } from '@/lib/home/editorial';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/BannerTiles.module.css');

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

  it('carries its module class on each card', () => {
    render(<BannerTiles tiles={tiles} />);
    const link = screen.getByRole('link', { name: /Outlet/ });
    expect(link.className).toContain(styles.card);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
