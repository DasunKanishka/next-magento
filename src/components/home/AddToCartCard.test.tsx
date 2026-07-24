import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { AddToCartCard } from './AddToCartCard';
import styles from './AddToCartCard.module.css';
import type { CanonicalProduct } from '@/lib/data-source';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/home/AddToCartCard.module.css',
);

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
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(screen.getByText('Added ✓')).toBeInTheDocument();
  });

  it('marks an out-of-stock line and tags it via a data attribute', () => {
    render(<AddToCartCard product={product({ stockStatus: 'OUT_OF_STOCK' })} />);
    expect(screen.getByText('Temporarily out of stock')).toBeInTheDocument();
    expect(screen.getByTestId('product-card')).toHaveAttribute(
      'data-stock',
      'OUT_OF_STOCK',
    );
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<AddToCartCard product={product()} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('carries its module class on the wrapper', () => {
    render(<AddToCartCard product={product()} />);
    expect(screen.getByTestId('product-card').className).toContain(styles.wrap);
  });

  it('forwards its fill class to the wrapped card so it fills the grid cell', () => {
    render(<AddToCartCard product={product()} />);
    // The ProductCard root is the first child of the wrapper; it must carry the
    // forwarded fill class (replacing the former inline height:100% style prop).
    const card = screen.getByTestId('product-card').firstElementChild;
    expect(card?.className).toContain(styles.card);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent across the in-stock/out-of-stock surface', () => {
    const inStock = render(<AddToCartCard product={product()} />);
    const outOfStock = render(
      <AddToCartCard product={product({ stockStatus: 'OUT_OF_STOCK' })} />,
    );
    const elements = [
      ...inStock.container.querySelectorAll('div'),
      ...outOfStock.container.querySelectorAll('div'),
    ];
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
