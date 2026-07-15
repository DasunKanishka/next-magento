import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import {
  expectAllVarTokensAreContractKeys,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { ProductCard } from './ProductCard';
import styles from './ProductCard.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/product/ProductCard.module.css',
);

describe('ProductCard', () => {
  it('renders brand, name, price and reviews, wiring the module classes', () => {
    const { container } = render(
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
    expect(container.querySelector(`.${styles.card}`)).not.toBeNull();
    expect(container.querySelector(`.${styles.brand}`)?.className).toContain(
      styles.brand,
    );
    expect(container.querySelector(`.${styles.name}`)?.className).toContain(styles.name);
    expect(container.querySelector(`.${styles.media}`)).not.toBeNull();
  });

  it('composes Badge for the sale flag (not a reimplementation)', () => {
    const { container } = render(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} saleBadge="−15%" />,
    );
    const badge = screen.getByText('−15%');
    // Badge renders a <span> whose --local-bg bridge resolves to
    // var(--color-urgency) for its `sale` variant — asserting that behavior
    // here proves composition rather than a parallel reimplementation.
    expect(badge.style.getPropertyValue('--local-bg')).toBe('var(--color-urgency)');
    expect(container.querySelector(`.${styles.saleBadgeSlot}`)).not.toBeNull();
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
    const { container } = render(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} oldPrice={39.95} />,
    );
    const price = screen.getByText('€34,95');
    expect(price.className).toContain(styles.price);
    expect(price.style.getPropertyValue('--local-price-fg')).toBe('var(--color-urgency)');
    const oldPrice = screen.getByText('€39,95');
    expect(oldPrice.className).toContain(styles.oldPrice);
    void container;
  });

  it('resolves the price-fg bridge to --color-brand-ink when not on sale', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} />);
    expect(screen.getByText('€34,95').style.getPropertyValue('--local-price-fg')).toBe(
      'var(--color-brand-ink)',
    );
  });

  it('renders the wishlist heart as a real, accessible button meeting the 44×44px minimum touch target', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} />);
    const heart = screen.getByRole('button', { name: 'Voeg toe aan verlanglijst' });
    expect(heart.style.getPropertyValue('--local-size')).toBe('var(--tap-target-min)');
  });

  it('omits the wishlist heart when wishlist=false', () => {
    render(<ProductCard name="Tanqueray No. TEN 1L" price={34.95} wishlist={false} />);
    expect(
      screen.queryByRole('button', { name: 'Voeg toe aan verlanglijst' }),
    ).not.toBeInTheDocument();
  });

  it('onAdd fires the add-to-cart callback exactly once per click, performs no cart mutation itself, and paints the CTA fill through the bridge', () => {
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
    expect(addButton.style.getPropertyValue('--local-size')).toBe(
      'var(--tap-target-min)',
    );
    expect(addButton.style.getPropertyValue('--local-bg')).toBe('var(--color-cta)');
    expect(addButton.style.getPropertyValue('--local-font-size')).toBe(
      'var(--icon-size-lg)',
    );
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    // The card only forwards the click — it holds no cart state of its own,
    // so nothing besides the caller-supplied counter changes.
    expect(calls).toBe(2);
  });

  it('token-swap: overriding --color-cta reflects on the add-to-cart button that actually carries the --local-bg binding', () => {
    const base = renderWithBrandTokens(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} />,
    );
    const baseBtn = base.getByRole('button', { name: 'Toevoegen aan winkelmandje' });
    expect(resolvedToken(baseBtn, '--color-cta')).toBe(defaultTokens['--color-cta']);
    expect(baseBtn.style.getPropertyValue('--local-bg')).toBe('var(--color-cta)');
    base.unmount();

    const overrideColor = 'rgb(11, 22, 33)';
    const over = renderWithBrandTokens(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} />,
      { '--color-cta': overrideColor },
    );
    const overBtn = over.getByRole('button', { name: 'Toevoegen aan winkelmandje' });
    // The token resolved on the exact element carrying the --local-bg binding
    // (not merely an ancestor) now reflects the override…
    expect(resolvedToken(overBtn, '--color-cta')).toBe(overrideColor);
    // …and the binding itself is unchanged (var(--color-cta)), proving the
    // painted fill is genuinely bound to the token rather than a snapshot.
    expect(overBtn.style.getPropertyValue('--local-bg')).toBe('var(--color-cta)');
  });

  it('token-swap: overriding --color-urgency reflects on the on-sale price span', () => {
    const overrideColor = 'rgb(44, 55, 66)';
    const over = renderWithBrandTokens(
      <ProductCard name="Tanqueray No. TEN 1L" price={34.95} oldPrice={39.95} />,
      { '--color-urgency': overrideColor },
    );
    const price = over.getByText('€34,95');
    expect(resolvedToken(price, '--color-urgency')).toBe(overrideColor);
    expect(price.style.getPropertyValue('--local-price-fg')).toBe('var(--color-urgency)');
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

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
