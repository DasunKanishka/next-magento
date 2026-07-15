import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { CategoryBar } from './CategoryBar';
import styles from './CategoryBar.module.css';
import type { HomeCategory } from '@/lib/home/home-data';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/CategoryBar.module.css');

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

  it('carries its module class on each link', () => {
    render(<CategoryBar categories={categories} />);
    expect(screen.getByRole('link', { name: 'Wijn' }).className).toContain(styles.link);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
