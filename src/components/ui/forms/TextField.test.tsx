import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectModuleCssReferencesRealTokens,
  pxValue,
} from '../test-utils/tokenAssertions';
import { TextField } from './TextField';
import styles from './TextField.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/forms/TextField.module.css',
);

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

  it('rests on the --color-border-field hairline and swaps to a --color-brand frame on focus', () => {
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    // Resting frame: emphasis-width border in the field color.
    expect(css).toMatch(
      /\.field\s*\{[\s\S]*?border:\s*var\(--border-width-emphasis\) solid var\(--color-border-field\)/,
    );
    // Focus frame: CTA-width border in the brand color + the focus ring.
    expect(css).toMatch(
      /\.field:focus\s*\{[\s\S]*?border:\s*var\(--border-width-cta\) solid var\(--color-brand\)/,
    );
    expect(css).toMatch(/\.field:focus\s*\{[\s\S]*?box-shadow:\s*var\(--focus-ring\)/);
    // The placeholder color is themed through the module too.
    expect(css).toMatch(
      /\.field::placeholder\s*\{[\s\S]*?color:\s*var\(--color-text-placeholder\)/,
    );
  });

  it('meets the 44×44px minimum touch target via --control-height-md', () => {
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/height:\s*var\(--control-height-md\)/);
    expect(pxValue(defaultTokens['--control-height-md'])).toBeGreaterThanOrEqual(44);
  });

  it('supports the type prop (e.g. email)', () => {
    render(<TextField type="email" placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText('you@example.com')).toHaveAttribute(
      'type',
      'email',
    );
  });

  it('carries its module class on the input', () => {
    render(<TextField placeholder="Zoek..." />);
    expect(screen.getByRole('textbox').className).toContain(styles.field);
  });

  it('merges a caller className without dropping the module class', () => {
    render(<TextField placeholder="Zoek..." className="caller-extra" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain(styles.field);
    expect(input.className).toContain('caller-extra');
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
