import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectAllVarTokensAreContractKeys,
  pxValue,
} from '../test-utils/tokenAssertions';
import { SearchBar } from './SearchBar';

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
    expect(screen.getByPlaceholderText(/Zoek 8.000\+ producten/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⌕ Zoeken' })).toBeInTheDocument();
  });

  it('navigates to /zoeken?q=<value> and calls onSearch on submit with a non-empty query', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'single malt whisky');
    await user.click(screen.getByRole('button', { name: '⌕ Zoeken' }));

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

  it('validates: an empty/whitespace-only query blocks navigation and shows an inline error', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByRole('searchbox'), '   ');
    await user.click(screen.getByRole('button', { name: '⌕ Zoeken' }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Vul een zoekterm in om te zoeken.',
    );
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a focus ring (--focus-ring) while the input is focused', () => {
    const { container } = render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    const frame = container.querySelector('form');
    expect(frame?.style.boxShadow).toBe('var(--focus-ring)');
    fireEvent.blur(input);
    expect(frame?.style.boxShadow).toBe('none');
  });

  it('default height (50) and submit button min-width both meet the 44px minimum touch target', () => {
    const { container } = render(<SearchBar />);
    const frame = container.querySelector('form');
    expect(frame?.style.height).toBe('50px');
    expect(50).toBeGreaterThanOrEqual(pxValue(defaultTokens['--tap-target-min']));

    const submitBtn = screen.getByRole('button', { name: '⌕ Zoeken' });
    expect(submitBtn.style.minWidth).toBe('var(--tap-target-min)');
    expect(pxValue(defaultTokens['--tap-target-min'])).toBeGreaterThanOrEqual(44);
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<SearchBar />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
