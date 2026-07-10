import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders every documented variant', () => {
    render(
      <>
        <Chip variant="spec">1 liter</Chip>
        <Chip variant="stock" dot>
          Op voorraad
        </Chip>
        <Chip variant="urgency">Nog 4 stuks</Chip>
        <Chip variant="award">Goud — World Whisky Awards</Chip>
      </>,
    );
    expect(screen.getByText('1 liter')).toBeInTheDocument();
    expect(screen.getByText('Op voorraad')).toBeInTheDocument();
    expect(screen.getByText('Nog 4 stuks')).toBeInTheDocument();
    expect(screen.getByText('Goud — World Whisky Awards')).toBeInTheDocument();
  });

  it('stock variant dot uses --color-cta; other variants use currentColor', () => {
    const { container, rerender } = render(
      <Chip variant="stock" dot>
        Op voorraad
      </Chip>,
    );
    const dot = () => container.querySelector<HTMLSpanElement>('span > span');
    expect(dot()?.style.background).toBe('var(--color-cta)');

    rerender(
      <Chip variant="urgency" dot>
        Nog 4 stuks
      </Chip>,
    );
    expect(dot()?.style.background.toLowerCase()).toBe('currentcolor');
  });

  it('award variant references trust chip/ink/border tokens', () => {
    const { container } = render(<Chip variant="award">Goud</Chip>);
    const el = container.querySelector('span');
    expect(el?.style.background).toBe('var(--color-trust-chip)');
    expect(el?.style.color).toBe('var(--color-trust-ink)');
    expect(el?.style.border).toContain('var(--color-trust-chip-border)');
  });

  it('every var(--*) this component emits is a real contract token (spec variant retains one intentional non-token literal border color — see component comment)', () => {
    const { container } = render(
      <>
        <Chip variant="spec">1 liter</Chip>
        <Chip variant="stock" dot>
          Op voorraad
        </Chip>
        <Chip variant="urgency">Nog 4 stuks</Chip>
        <Chip variant="award">Goud</Chip>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
