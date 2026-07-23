import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { StatCallout } from '@/lib/home/editorial';
import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { SeoContent } from './SeoContent';
import styles from './SeoContent.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/SeoContent.module.css');

const HTML = '<h2>Wijn online bestellen</h2><p>Ruim assortiment.</p>';

const STATS: StatCallout[] = [
  { value: '8.000+', label: 'producten op voorraad' },
  { value: '4,8 ★', label: 'gemiddelde klantbeoordeling' },
  { value: 'Morgen in huis', label: 'bij bestelling voor 22:00' },
];

describe('SeoContent', () => {
  it('renders every authored headline figure', () => {
    render(<SeoContent html={HTML} stats={STATS} />);
    expect(screen.getByText('8.000+')).toBeInTheDocument();
    expect(screen.getByText('4,8 ★')).toBeInTheDocument();
    expect(screen.getByText('Morgen in huis')).toBeInTheDocument();
  });

  it('injects the already-sanitized editorial copy', () => {
    render(<SeoContent html={HTML} stats={STATS} />);
    const copy = screen.getByTestId('seo-copy');
    expect(copy.querySelector('h2')?.textContent).toBe('Wijn online bestellen');
    expect(copy.textContent).toContain('Ruim assortiment.');
  });

  it('still renders the figures when no copy is authored', () => {
    render(<SeoContent html="" stats={STATS} />);
    expect(screen.getByText('8.000+')).toBeInTheDocument();
    expect(screen.queryByTestId('seo-copy')).not.toBeInTheDocument();
  });

  it('still renders the copy when no figures are authored', () => {
    render(<SeoContent html={HTML} stats={[]} />);
    expect(screen.getByTestId('seo-copy')).toBeInTheDocument();
    expect(screen.queryByText('8.000+')).not.toBeInTheDocument();
  });

  it('renders nothing at all when neither figures nor copy are authored (empty-backend invariant)', () => {
    const { container } = render(<SeoContent html="" stats={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('carries its module class on the copy block', () => {
    render(<SeoContent html={HTML} stats={STATS} />);
    expect(screen.getByTestId('seo-copy').className).toContain(styles.copy);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
