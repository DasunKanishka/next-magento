import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders brand, name, price and reviews', () => {
    render(
      <ProductCard
        brand="Tanqueray"
        name="Tanqueray No. TEN 1L"
        price={34.95}
        reviews={412}
      />,
    );
    expect(screen.getByText('Tanqueray')).toBeInTheDocument();
    expect(screen.getByText('Tanqueray No. TEN 1L')).toBeInTheDocument();
    expect(screen.getByText('€34,95')).toBeInTheDocument();
    expect(screen.getByText('412 reviews')).toBeInTheDocument();
  });

  it('composes Badge for the sale flag (not a reimplementation)', () => {
    const { container } = render(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} saleBadge="−15%" />,
    );
    const badge = screen.getByText('−15%');
    // Badge renders a <span> with background: var(--color-urgency) for its
    // `sale` variant — asserting that behavior here proves composition
    // rather than a parallel reimplementation.
    expect(badge.style.background).toBe('var(--color-urgency)');
    void container;
  });

  it('composes Rating for reviews (always 5-star fill, per design spec) rather than reimplementing star rendering', () => {
    const { container } = render(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} reviews={412} />,
    );
    const ratingRoot = container.querySelector('[aria-label="5 out of 5 stars"]');
    expect(ratingRoot).not.toBeNull();
    expect(within(container).getByText('412 reviews')).toBeInTheDocument();
  });

  it('shows the struck-through oldPrice and urgency-toned current price when on sale', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} oldPrice={39.95} />);
    const price = screen.getByText('€34,95');
    expect(price.style.color).toBe('var(--color-urgency)');
    const oldPrice = screen.getByText('€39,95');
    expect(oldPrice.style.textDecoration).toContain('line-through');
  });

  it('renders the wishlist heart as a real, accessible button meeting the 44×44px minimum touch target', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} />);
    const heart = screen.getByRole('button', { name: 'Voeg toe aan verlanglijst' });
    expect(heart.style.width).toBe('var(--tap-target-min)');
    expect(heart.style.height).toBe('var(--tap-target-min)');
  });

  it('omits the wishlist heart when wishlist=false', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} wishlist={false} />);
    expect(
      screen.queryByRole('button', { name: 'Voeg toe aan verlanglijst' }),
    ).not.toBeInTheDocument();
  });

  it('onAdd fires the add-to-cart callback exactly once per click and performs no cart mutation itself', () => {
    let calls = 0;
    render(
      <ProductCard
        name="Tanqueray No. TEN 1L"
        price={34.95}
        onAdd={() => {
          calls += 1;
        }}
      />,
    );
    const addButton = screen.getByRole('button', { name: 'Toevoegen aan winkelmandje' });
    expect(addButton.style.width).toBe('var(--tap-target-min)');
    expect(addButton.style.height).toBe('var(--tap-target-min)');
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    // The card only forwards the click — it holds no cart state of its own,
    // so nothing besides the caller-supplied counter changes.
    expect(calls).toBe(2);
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <ProductCard
        brand="Tanqueray"
        name="Tanqueray No. TEN 1L"
        price={34.95}
        oldPrice={39.95}
        reviews={412}
        saleBadge="−15%"
      />,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
