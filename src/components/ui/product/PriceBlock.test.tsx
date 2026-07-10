import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { formatEuro, PriceBlock } from './PriceBlock';

describe('formatEuro', () => {
  it('formats a number as €x,xx (comma decimal, € prefix)', () => {
    expect(formatEuro(34.95)).toBe('€34,95');
    expect(formatEuro(74.95)).toBe('€74,95');
    expect(formatEuro(5)).toBe('€5,00');
  });

  it('passes preformatted strings through unchanged', () => {
    expect(formatEuro('Op aanvraag')).toBe('Op aanvraag');
  });
});

describe('PriceBlock', () => {
  it('renders the current price, formatted to €x,xx', () => {
    render(<PriceBlock price={34.95} />);
    expect(screen.getByText('€34,95')).toBeInTheDocument();
  });

  it('renders the struck-through oldPrice and turns the current price urgency-toned when on sale', () => {
    const { container } = render(<PriceBlock price={74.95} oldPrice={89.95} />);
    expect(screen.getByText('€74,95')).toBeInTheDocument();
    expect(screen.getByText('€89,95')).toBeInTheDocument();
    const priceEl = screen.getByText('€74,95');
    expect(priceEl.style.color).toBe('var(--color-urgency)');
    const oldPriceEl = screen.getByText('€89,95');
    expect(oldPriceEl.style.textDecoration).toContain('line-through');
    void container;
  });

  it('auto-computes the savings label from concrete price/oldPrice pairs when showSavings is set', () => {
    render(<PriceBlock price={74.95} oldPrice={89.95} showSavings />);
    expect(screen.getByText('Je bespaart €15,00')).toBeInTheDocument();
  });

  it('does not render a savings label when showSavings is false, even on sale', () => {
    render(<PriceBlock price={74.95} oldPrice={89.95} />);
    expect(screen.queryByText(/Je bespaart/)).not.toBeInTheDocument();
  });

  it('savingsLabel overrides the auto-computed savings text', () => {
    render(
      <PriceBlock
        price={74.95}
        oldPrice={89.95}
        showSavings
        savingsLabel="−N% korting"
      />,
    );
    expect(screen.getByText('−N% korting')).toBeInTheDocument();
    expect(screen.queryByText(/Je bespaart/)).not.toBeInTheDocument();
  });

  it('renders perUnit and note joined with a middle dot', () => {
    render(
      <PriceBlock
        price={74.95}
        perUnit="€107,07 / liter"
        note="Incl. btw, excl. verzendkosten"
      />,
    );
    expect(
      screen.getByText('€107,07 / liter · Incl. btw, excl. verzendkosten'),
    ).toBeInTheDocument();
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <PriceBlock
        price={74.95}
        oldPrice={89.95}
        showSavings
        perUnit="€107,07 / liter"
        note="Incl. btw, excl. verzendkosten"
      />,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
