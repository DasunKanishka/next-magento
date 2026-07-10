import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders every documented variant', () => {
    render(
      <>
        <Badge variant="sale">-17%</Badge>
        <Badge variant="new">Nieuw</Badge>
        <Badge variant="tip">Toptip</Badge>
        <Badge variant="deals">Deals</Badge>
        <Badge variant="bestseller">Bestseller</Badge>
      </>,
    );
    expect(screen.getByText('-17%')).toBeInTheDocument();
    expect(screen.getByText('Nieuw')).toBeInTheDocument();
    expect(screen.getByText('Toptip')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
  });

  it('sale/deals map to --color-urgency, new/bestseller to --color-brand, tip to --color-premium-accent', () => {
    const { rerender, container } = render(<Badge variant="sale">-17%</Badge>);
    expect(container.querySelector('span')?.style.background).toBe('var(--color-urgency)');

    rerender(<Badge variant="deals">Deals</Badge>);
    expect(container.querySelector('span')?.style.background).toBe('var(--color-urgency)');

    rerender(<Badge variant="new">Nieuw</Badge>);
    expect(container.querySelector('span')?.style.background).toBe('var(--color-brand)');

    rerender(<Badge variant="bestseller">Bestseller</Badge>);
    expect(container.querySelector('span')?.style.background).toBe('var(--color-brand)');

    rerender(<Badge variant="tip">Toptip</Badge>);
    expect(container.querySelector('span')?.style.background).toBe('var(--color-premium-accent)');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <>
        <Badge variant="sale">-17%</Badge>
        <Badge variant="tip">Toptip</Badge>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
