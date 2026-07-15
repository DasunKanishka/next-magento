import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { Rating } from './Rating';
import styles from './Rating.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Rating.module.css');

describe('Rating', () => {
  it('renders rounded star fill, score, and review count, wiring the module classes', () => {
    const { container } = render(<Rating value={4.6} score={4.6} count={12000} />);
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('12000 reviews')).toBeInTheDocument();
    expect(container.querySelector('span')?.className).toContain(styles.wrap);
    expect(container.querySelector(`.${styles.star}`)).not.toBeNull();
    expect(container.querySelector(`.${styles.score}`)).not.toBeNull();
    expect(container.querySelector(`.${styles.count}`)).not.toBeNull();
  });

  it('omits score/count when not provided', () => {
    render(<Rating value={5} />);
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });

  it('clamps value to the 0–5 range', () => {
    const { container: over, unmount: unmountOver } = render(<Rating value={7} />);
    expect(over.querySelector('[aria-hidden]')?.textContent).toBe('★★★★★');
    unmountOver();

    const { container: under } = render(<Rating value={-2} />);
    expect(under.querySelector('[aria-hidden]')?.textContent).toBe('☆☆☆☆☆');
  });

  it('defaults the font-size bridge to --type-caption-size (13px)', () => {
    const { container } = render(<Rating value={5} />);
    expect(
      container.querySelector('span')?.style.getPropertyValue('--local-font-size'),
    ).toBe('var(--type-caption-size)');
  });

  it('an explicit size override bridges as a plain computed px value', () => {
    const { container } = render(<Rating value={5} size={11} />);
    expect(
      container.querySelector('span')?.style.getPropertyValue('--local-font-size'),
    ).toBe('11px');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<Rating value={4.8} score={4.8} count={12000} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = render(<Rating value={4.8} score={4.8} count={12000} />);
    const wrap = container.querySelector('span');
    expectBridgePropsConsistent(
      wrap ? [wrap] : [],
      readFileSync(MODULE_CSS_PATH, 'utf8'),
    );
  });
});
