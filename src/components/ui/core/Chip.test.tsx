import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { Chip } from './Chip';
import styles from './Chip.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Chip.module.css');

function renderAllVariants() {
  return render(
    <>
      <Chip variant="spec">1 liter</Chip>
      <Chip variant="stock" dot>
        Op voorraad
      </Chip>
      <Chip variant="urgency" dot>
        Nog 4 stuks
      </Chip>
      <Chip variant="award">Goud — World Whisky Awards</Chip>
    </>,
  );
}

describe('Chip', () => {
  it('renders every documented variant and wires the module class + data-variant', () => {
    const { container } = renderAllVariants();
    expect(screen.getByText('1 liter')).toBeInTheDocument();
    expect(screen.getByText('Op voorraad')).toBeInTheDocument();
    expect(screen.getByText('Nog 4 stuks')).toBeInTheDocument();
    expect(screen.getByText('Goud — World Whisky Awards')).toBeInTheDocument();
    const chips = Array.from(container.querySelectorAll('[data-variant]'));
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.className).toContain(styles.chip);
    }
  });

  it('stock variant dot uses --color-cta; other variants use currentColor', () => {
    // --local-dot-bg is set on the chip's own root span (consumed by the
    // nested .dot span via CSS custom-property inheritance), so it is read
    // off the root, not the dot span itself.
    const { container, rerender } = render(
      <Chip variant="stock" dot>
        Op voorraad
      </Chip>,
    );
    const root = () => container.querySelector<HTMLSpanElement>('[data-variant]');
    const dot = () => container.querySelector<HTMLSpanElement>(`.${styles.dot}`);
    expect(dot()?.className).toContain(styles.dot);
    expect(root()?.style.getPropertyValue('--local-dot-bg')).toBe('var(--color-cta)');

    rerender(
      <Chip variant="urgency" dot>
        Nog 4 stuks
      </Chip>,
    );
    expect(root()?.style.getPropertyValue('--local-dot-bg')).toBe('currentColor');
  });

  it('award variant references trust chip/ink/border tokens through the bridge', () => {
    const { container } = render(<Chip variant="award">Goud</Chip>);
    const el = container.querySelector('[data-variant="award"]');
    expect(el?.getAttribute('style')).toContain('--local-bg: var(--color-trust-chip)');
    expect(el?.getAttribute('style')).toContain('--local-fg: var(--color-trust-ink)');
    expect(el?.getAttribute('style')).toContain(
      '--local-border: var(--color-trust-chip-border)',
    );
  });

  it("spec variant's outline border resolves to the dedicated --color-border-chip-spec token (retired literal exception)", () => {
    const { container } = render(<Chip variant="spec">1 liter</Chip>);
    const el = container.querySelector('[data-variant="spec"]');
    expect(el?.getAttribute('style')).toContain(
      '--local-border: var(--color-border-chip-spec)',
    );
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = renderAllVariants();
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = renderAllVariants();
    const chips = Array.from(container.querySelectorAll('[data-variant]'));
    const dots = Array.from(container.querySelectorAll(`.${styles.dot}`));
    expectBridgePropsConsistent(
      [...chips, ...dots],
      readFileSync(MODULE_CSS_PATH, 'utf8'),
    );
  });
});
