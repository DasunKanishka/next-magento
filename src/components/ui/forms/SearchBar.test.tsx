import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectModuleCssReferencesRealTokens,
  pxValue,
} from '../test-utils/tokenAssertions';
import { SearchBar } from './SearchBar';
import styles from './SearchBar.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/forms/SearchBar.module.css',
);

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe('SearchBar', () => {
  it('renders with the documented default placeholder and button label', () => {
    render(<SearchBar />);
    expect(
      screen.getByPlaceholderText(/Search brand, type, or product/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⌕ Search' })).toBeInTheDocument();
  });

  it('navigates to /zoeken?q=<value> and calls onSearch on submit with a non-empty query', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'single malt whisky');
    await user.click(screen.getByRole('button', { name: '⌕ Search' }));

    expect(push).toHaveBeenCalledWith('/zoeken?q=single%20malt%20whisky');
    expect(onSearch).toHaveBeenCalledWith('single malt whisky');
  });

  it('submits on Enter within the input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'gin{Enter}');
    expect(push).toHaveBeenCalledWith('/zoeken?q=gin');
  });

  it('validates: an empty/whitespace-only query blocks navigation, flags the row, and shows an inline error', async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchBar />);
    await user.type(screen.getByRole('searchbox'), '   ');
    await user.click(screen.getByRole('button', { name: '⌕ Search' }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a search term to search.');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    // The invalid frame is a data-attribute variant the module keys off.
    expect(container.querySelector('form')).toHaveAttribute('data-invalid', 'true');
  });

  it('drives the focus ring via a :focus-within rule in the module', () => {
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(
      /\.row:focus-within\s*\{[\s\S]*?box-shadow:\s*var\(--focus-ring\)/,
    );
  });

  it('default row min-height (--search-row-h) and submit button min-width both meet the 44px minimum touch target', () => {
    const { container } = render(<SearchBar />);
    const form = container.querySelector('form');
    // Default row is not compact.
    expect(form).toHaveAttribute('data-compact', 'false');

    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/\.row\s*\{[\s\S]*?min-height:\s*var\(--search-row-h\)/);
    expect(css).toMatch(/\.submit\s*\{[\s\S]*?min-width:\s*var\(--tap-target-min\)/);

    // Both configured heights clear the tap-target minimum.
    expect(pxValue(defaultTokens['--search-row-h'])).toBeGreaterThanOrEqual(44);
    expect(pxValue(defaultTokens['--search-row-h-compact'])).toBeGreaterThanOrEqual(44);
    expect(pxValue(defaultTokens['--tap-target-min'])).toBeGreaterThanOrEqual(44);
  });

  it('applies the compact row height variant via data-compact', () => {
    const { container } = render(<SearchBar compact />);
    expect(container.querySelector('form')).toHaveAttribute('data-compact', 'true');
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(
      /\.row\[data-compact='true'\]\s*\{[\s\S]*?min-height:\s*var\(--search-row-h-compact\)/,
    );
  });

  it('carries its module class on the row', () => {
    const { container } = render(<SearchBar />);
    expect(container.querySelector('form')?.className).toContain(styles.row);
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
