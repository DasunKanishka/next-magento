import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { Badge } from './Badge';
import styles from './Badge.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Badge.module.css');

function renderAllVariants() {
  return render(
    <>
      <Badge variant="sale">-17%</Badge>
      <Badge variant="new">Nieuw</Badge>
      <Badge variant="tip">Toptip</Badge>
      <Badge variant="deals">Deals</Badge>
      <Badge variant="bestseller">Bestseller</Badge>
    </>,
  );
}

describe('Badge', () => {
  it('renders every documented variant and wires the module class', () => {
    const { container } = renderAllVariants();
    expect(screen.getByText('-17%')).toBeInTheDocument();
    expect(screen.getByText('Nieuw')).toBeInTheDocument();
    expect(screen.getByText('Toptip')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
    for (const span of Array.from(container.querySelectorAll('span'))) {
      expect(span.className).toContain(styles.badge);
    }
  });

  it('sale/deals map to --color-urgency, new/bestseller to --color-brand, tip to --color-premium-accent', () => {
    const { rerender, container } = render(<Badge variant="sale">-17%</Badge>);
    const span = () => container.querySelector('span');
    expect(span()?.style.getPropertyValue('--local-bg')).toBe('var(--color-urgency)');

    rerender(<Badge variant="deals">Deals</Badge>);
    expect(span()?.style.getPropertyValue('--local-bg')).toBe('var(--color-urgency)');

    rerender(<Badge variant="new">Nieuw</Badge>);
    expect(span()?.style.getPropertyValue('--local-bg')).toBe('var(--color-brand)');

    rerender(<Badge variant="bestseller">Bestseller</Badge>);
    expect(span()?.style.getPropertyValue('--local-bg')).toBe('var(--color-brand)');

    rerender(<Badge variant="tip">Toptip</Badge>);
    expect(span()?.style.getPropertyValue('--local-bg')).toBe(
      'var(--color-premium-accent)',
    );
  });

  it('every variant uses the on-fill text token, not a raw literal', () => {
    const { container } = renderAllVariants();
    for (const span of Array.from(container.querySelectorAll('span'))) {
      expect(span.style.getPropertyValue('--local-fg')).toBe('var(--color-text-on-fill)');
    }
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
    const spans = Array.from(container.querySelectorAll('span'));
    expectBridgePropsConsistent(spans, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
