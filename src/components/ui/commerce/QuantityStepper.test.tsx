import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
  pxValue,
} from '../test-utils/tokenAssertions';
import { QuantityStepper } from './QuantityStepper';
import styles from './QuantityStepper.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/commerce/QuantityStepper.module.css',
);

describe('QuantityStepper', () => {
  it('renders the current value between − and + controls, wiring the module classes', () => {
    const { container } = render(<QuantityStepper value={3} onChange={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aantal verlagen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aantal verhogen' })).toBeInTheDocument();
    expect(container.querySelector(`.${styles.wrap}`)).not.toBeNull();
    expect(container.querySelector(`.${styles.num}`)).not.toBeNull();
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      expect(btn.className).toContain(styles.button);
    }
  });

  it('defaults to the [1,99] range', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={1}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(2);
  });

  it('clamps below min to min', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={1}
        min={1}
        max={99}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verlagen' }));
    expect(next).toBe(1);
  });

  it('clamps above max to max', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={99}
        min={1}
        max={99}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(99);
  });

  it('clamps to a custom [min,max] range', () => {
    let next: number | undefined;
    const onChange = (n: number) => {
      next = n;
    };
    const { rerender } = render(
      <QuantityStepper value={2} min={2} max={6} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verlagen' }));
    expect(next).toBe(2);

    rerender(<QuantityStepper value={6} min={2} max={6} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(6);
  });

  it('md and lg sizes both bridge to control-height tokens meeting the 44×44px minimum touch target', () => {
    const { container, rerender } = render(
      <QuantityStepper value={1} size="md" onChange={() => {}} />,
    );
    const wrap = () => container.querySelector(`.${styles.wrap}`) as HTMLElement;
    expect(wrap().style.getPropertyValue('--local-btn-w')).toBe('var(--tap-target-min)');
    expect(wrap().style.getPropertyValue('--local-btn-h')).toBe(
      'var(--control-height-md)',
    );
    expect(pxValue(defaultTokens['--tap-target-min'])).toBeGreaterThanOrEqual(44);
    expect(pxValue(defaultTokens['--control-height-md'])).toBeGreaterThanOrEqual(44);

    rerender(<QuantityStepper value={1} size="lg" onChange={() => {}} />);
    expect(wrap().style.getPropertyValue('--local-btn-w')).toBe('var(--tap-target-min)');
    expect(wrap().style.getPropertyValue('--local-btn-h')).toBe(
      'var(--control-height-lg)',
    );
    expect(pxValue(defaultTokens['--control-height-lg'])).toBeGreaterThanOrEqual(44);
  });

  it('the numeral column width bridges to a real token per size (md snaps to --space-8, lg to the dedicated --stepper-num-w-lg)', () => {
    const { container, rerender } = render(
      <QuantityStepper value={1} size="md" onChange={() => {}} />,
    );
    const wrap = () => container.querySelector(`.${styles.wrap}`) as HTMLElement;
    expect(wrap().style.getPropertyValue('--local-num-w')).toBe('var(--space-8)');

    rerender(<QuantityStepper value={1} size="lg" onChange={() => {}} />);
    expect(wrap().style.getPropertyValue('--local-num-w')).toBe(
      'var(--stepper-num-w-lg)',
    );
    expect(defaultTokens['--stepper-num-w-lg']).toBe('40px');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<QuantityStepper value={1} onChange={() => {}} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = render(<QuantityStepper value={1} onChange={() => {}} />);
    const wrap = container.querySelector(`.${styles.wrap}`);
    expectBridgePropsConsistent(
      wrap ? [wrap] : [],
      readFileSync(MODULE_CSS_PATH, 'utf8'),
    );
  });
});
