import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { SeoContent } from './SeoContent';
import styles from './SeoContent.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/SeoContent.module.css');

const HTML = '<h2>Wijn online bestellen</h2><p>Ruim assortiment.</p>';

describe('SeoContent', () => {
  it('renders the three headline figures', () => {
    render(<SeoContent html={HTML} />);
    expect(screen.getByText('8.000+')).toBeInTheDocument();
    expect(screen.getByText('4,8 ★')).toBeInTheDocument();
    expect(screen.getByText('Morgen in huis')).toBeInTheDocument();
  });

  it('injects the already-sanitized editorial copy', () => {
    render(<SeoContent html={HTML} />);
    const copy = screen.getByTestId('seo-copy');
    expect(copy.querySelector('h2')?.textContent).toBe('Wijn online bestellen');
    expect(copy.textContent).toContain('Ruim assortiment.');
  });

  it('still renders the figures when no copy is authored', () => {
    render(<SeoContent html="" />);
    expect(screen.getByText('8.000+')).toBeInTheDocument();
    expect(screen.queryByTestId('seo-copy')).not.toBeInTheDocument();
  });

  it('carries its module class on the copy block', () => {
    render(<SeoContent html={HTML} />);
    expect(screen.getByTestId('seo-copy').className).toContain(styles.copy);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
