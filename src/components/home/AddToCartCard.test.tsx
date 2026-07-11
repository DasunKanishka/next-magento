import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { AddToCartCard } from './AddToCartCard';
import type { CanonicalProduct } from '@/lib/data-source';

function product(overrides: Partial<CanonicalProduct> = {}): CanonicalProduct {
  return {
    sku: 'SKU1',
    name: 'Ida Workout Pant',
    urlKey: 'ida',
    brand: '',
    imageUrl: '',
    imageAlt: '',
    price: { amount: 38.4, currency: 'EUR' },
    oldPrice: { amount: 48, currency: 'EUR' },
    reviewCount: 3,
    stockStatus: 'IN_STOCK',
    ...overrides,
  };
}

describe('AddToCartCard', () => {
  it('renders the product name, price, and a discount flag', () => {
    render(<AddToCartCard product={product()} />);
    expect(screen.getByText('Ida Workout Pant')).toBeInTheDocument();
    expect(screen.getByText('€38,40')).toBeInTheDocument();
    expect(screen.getByText('−20%')).toBeInTheDocument();
  });

  it('acknowledges an add click without mutating a basket', async () => {
    const user = userEvent.setup();
    render(<AddToCartCard product={product()} />);
    await user.click(screen.getByRole('button', { name: /winkelmandje/i }));
    expect(screen.getByText('Toegevoegd ✓')).toBeInTheDocument();
  });

  it('marks an out-of-stock line and tags it via a data attribute', () => {
    render(<AddToCartCard product={product({ stockStatus: 'OUT_OF_STOCK' })} />);
    expect(screen.getByText('Tijdelijk uitverkocht')).toBeInTheDocument();
    expect(screen.getByTestId('product-card')).toHaveAttribute(
      'data-stock',
      'OUT_OF_STOCK',
    );
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<AddToCartCard product={product()} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
