import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectAllVarTokensAreContractKeys,
  pxValue,
} from '../test-utils/tokenAssertions';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders circle and rounded shapes', () => {
    const { container: circleContainer } = render(
      <IconButton shape="circle" aria-label="Wishlist">
        ♥
      </IconButton>,
    );
    expect(within(circleContainer).getByRole('button').style.borderRadius).toBe('50%');

    const { container: roundedContainer } = render(
      <IconButton shape="rounded" aria-label="Increase quantity">
        +
      </IconButton>,
    );
    expect(within(roundedContainer).getByRole('button').style.borderRadius).toBe(
      'var(--radius-md)',
    );
  });

  it('defaults to the --tap-target-min token (44px) — meets the minimum touch target', () => {
    const { getByRole } = render(<IconButton aria-label="Add">+</IconButton>);
    const btn = getByRole('button');
    expect(btn.style.width).toBe('var(--tap-target-min)');
    expect(btn.style.height).toBe('var(--tap-target-min)');
    expect(pxValue(defaultTokens['--tap-target-min'])).toBeGreaterThanOrEqual(44);
  });

  it('accepts an explicit numeric size override', () => {
    const { getByRole } = render(
      <IconButton size={40} aria-label="Small">
        +
      </IconButton>,
    );
    expect(getByRole('button').style.width).toBe('40px');
  });

  it('bordered defaults to true using --color-border-field', () => {
    const { getByRole } = render(<IconButton aria-label="Bordered">+</IconButton>);
    expect(getByRole('button').style.border).toContain('var(--color-border-field)');
  });

  it('unbordered removes the border', () => {
    const { getByRole } = render(
      <IconButton bordered={false} aria-label="Unbordered">
        +
      </IconButton>,
    );
    const btn = getByRole('button');
    expect(btn.style.border).not.toContain('var(--color-border-field)');
    expect(btn.style.borderStyle).toBe('none');
  });

  it('default glyph color is --color-brand', () => {
    const { getByRole } = render(<IconButton aria-label="Default color">+</IconButton>);
    expect(getByRole('button').style.color).toBe('var(--color-brand)');
  });

  it('fires onClick', () => {
    let clicked = false;
    const { getByRole } = render(
      <IconButton aria-label="Click me" onClick={() => (clicked = true)}>
        +
      </IconButton>,
    );
    fireEvent.click(getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <>
        <IconButton shape="circle" aria-label="A">
          +
        </IconButton>
        <IconButton shape="rounded" aria-label="B" bordered={false}>
          -
        </IconButton>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
