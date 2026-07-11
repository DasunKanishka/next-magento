import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { SeoContent } from './SeoContent';

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

  it('emits only real contract tokens', () => {
    const { container } = render(<SeoContent html={HTML} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
