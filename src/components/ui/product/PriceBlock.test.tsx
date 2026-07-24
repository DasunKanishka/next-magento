import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { formatEuro, PriceBlock } from './PriceBlock';
import styles from './PriceBlock.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/product/PriceBlock.module.css',
);

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
  it('renders the current price, formatted to €x,xx, wiring the module class', () => {
    const { container } = render(<PriceBlock price={34.95} />);
    expect(screen.getByText('€34,95')).toBeInTheDocument();
    expect(container.querySelector<HTMLElement>(`.${styles.row}`)).not.toBeNull();
    expect(container.querySelector<HTMLElement>(`.${styles.price}`)?.className).toContain(
      styles.price,
    );
  });

  it('renders the struck-through oldPrice and turns the current price urgency-toned when on sale', () => {
    const { container } = render(<PriceBlock price={74.95} oldPrice={89.95} />);
    expect(screen.getByText('€74,95')).toBeInTheDocument();
    expect(screen.getByText('€89,95')).toBeInTheDocument();
    const row = container.querySelector<HTMLElement>(`.${styles.row}`);
    expect(row?.style.getPropertyValue('--local-price-fg')).toBe('var(--color-urgency)');
    const oldPriceEl = screen.getByText('€89,95');
    expect(oldPriceEl.className).toContain(styles.oldPrice);
  });

  it('resolves the price-fg bridge to --color-brand-ink when not on sale', () => {
    const { container } = render(<PriceBlock price={34.95} />);
    expect(
      container
        .querySelector<HTMLElement>(`.${styles.row}`)
        ?.style.getPropertyValue('--local-price-fg'),
    ).toBe('var(--color-brand-ink)');
  });

  it('auto-computes the savings label from concrete price/oldPrice pairs when showSavings is set', () => {
    render(<PriceBlock price={74.95} oldPrice={89.95} showSavings />);
    expect(screen.getByText('You save €15,00')).toBeInTheDocument();
  });

  it('does not render a savings label when showSavings is false, even on sale', () => {
    render(<PriceBlock price={74.95} oldPrice={89.95} />);
    expect(screen.queryByText(/You save/)).not.toBeInTheDocument();
  });

  it('savingsLabel overrides the auto-computed savings text', () => {
    render(
      <PriceBlock price={74.95} oldPrice={89.95} showSavings savingsLabel="−N% off" />,
    );
    expect(screen.getByText('−N% off')).toBeInTheDocument();
    expect(screen.queryByText(/You save/)).not.toBeInTheDocument();
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

  it('the default price-size bridge stays brand-overridable — it resolves to --type-stat-size (34px), not a baked literal, and the old price to half of it', () => {
    const { container } = render(<PriceBlock price={34.95} oldPrice={39.95} />);
    const row = container.querySelector<HTMLElement>(`.${styles.row}`);
    // Default render bridges to the token (a brand can retheme it), NOT a
    // hard-coded 34px — --type-stat-size is 34px so the rendered value is
    // unchanged, but it now flows through the contract like Rating/IconButton.
    expect(row?.style.getPropertyValue('--local-price-size')).toBe(
      'var(--type-stat-size)',
    );
    expect(row?.style.getPropertyValue('--local-old-price-size')).toBe(
      'calc(var(--type-stat-size) * 0.5)',
    );
  });

  it('an explicit size override scales both bridged font-sizes proportionally', () => {
    const { container } = render(<PriceBlock price={34.95} oldPrice={39.95} size={20} />);
    const row = container.querySelector<HTMLElement>(`.${styles.row}`);
    expect(row?.style.getPropertyValue('--local-price-size')).toBe('20px');
    expect(row?.style.getPropertyValue('--local-old-price-size')).toBe('10px');
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

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = render(
      <PriceBlock price={74.95} oldPrice={89.95} showSavings />,
    );
    const row = container.querySelector<HTMLElement>(`.${styles.row}`);
    expectBridgePropsConsistent(row ? [row] : [], readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
