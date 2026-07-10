import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectAllVarTokensAreContractKeys,
  pxValue,
} from '../test-utils/tokenAssertions';
import { TextField } from './TextField';

describe('TextField', () => {
  it('renders with a placeholder and forwards value/onChange', () => {
    let value = '';
    const { rerender } = render(
      <TextField
        placeholder="Zoek..."
        value={value}
        onChange={(e) => {
          value = e.target.value;
        }}
      />,
    );
    const input = screen.getByPlaceholderText('Zoek...');
    fireEvent.change(input, { target: { value: 'gin' } });
    expect(value).toBe('gin');
    rerender(<TextField placeholder="Zoek..." value={value} onChange={() => {}} />);
    expect(screen.getByDisplayValue('gin')).toBeInTheDocument();
  });

  it('rests on --color-border-field and swaps to a 2px --color-brand frame on focus', () => {
    render(<TextField />);
    const input = screen.getByRole('textbox');
    expect(input.style.border).toContain('var(--color-border-field)');

    fireEvent.focus(input);
    expect(input.style.border).toContain('2px solid var(--color-brand)');
    expect(input.style.boxShadow).toBe('var(--focus-ring)');

    fireEvent.blur(input);
    expect(input.style.border).toContain('var(--color-border-field)');
    expect(input.style.boxShadow).toBe('none');
  });

  it('meets the 44×44px minimum touch target via --control-height-md', () => {
    render(<TextField />);
    const input = screen.getByRole('textbox');
    expect(input.style.height).toBe('var(--control-height-md)');
    expect(pxValue(defaultTokens['--control-height-md'])).toBeGreaterThanOrEqual(44);
  });

  it('supports the type prop (e.g. email)', () => {
    render(<TextField type="email" placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText('you@example.com')).toHaveAttribute(
      'type',
      'email',
    );
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<TextField placeholder="Zoek..." />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
