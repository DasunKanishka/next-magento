import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { languages } from '@/i18n/languages';
import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('renders the full trigger with a label + active language name', () => {
    render(<LanguageSelector value="nl" />);
    const trigger = screen.getByRole('button', { name: /Taal: Nederlands/ });
    expect(within(trigger).getByText('Taal')).toBeInTheDocument();
    expect(within(trigger).getByText('Nederlands')).toBeInTheDocument();
  });

  it('compact mode omits the descriptive label', () => {
    render(<LanguageSelector value="nl" compact />);
    // The word "Taal" label copy is not rendered in compact mode.
    expect(screen.queryByText('Taal')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taal: Nederlands/ })).toBeInTheDocument();
  });

  it('opens a single-column list of all 6 languages', () => {
    render(<LanguageSelector value="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    const menu = screen.getByRole('menu', { name: 'Taal' });
    for (const l of languages) {
      expect(within(menu).getByText(l.name)).toBeInTheDocument();
    }
  });

  it('marks the active language as checked', () => {
    render(<LanguageSelector value="de" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    expect(screen.getByRole('menuitemradio', { name: /Duits/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('closes on selection and reports the chosen locale', () => {
    const onLanguageChange = vi.fn();
    render(<LanguageSelector value="nl" onLanguageChange={onLanguageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Frans/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<LanguageSelector value="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <button type="button">buiten</button>
        <LanguageSelector value="nl" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'buiten' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger meets the 44×44px minimum tap target in both modes', () => {
    const { rerender } = render(<LanguageSelector value="nl" />);
    let trigger = screen.getByRole('button', { name: /Taal:/ });
    expect(trigger.style.minHeight).toBe('var(--tap-target-min)');
    expect(trigger.style.minWidth).toBe('var(--tap-target-min)');

    rerender(<LanguageSelector value="nl" compact />);
    trigger = screen.getByRole('button', { name: /Taal:/ });
    expect(trigger.style.minHeight).toBe('var(--tap-target-min)');
    expect(trigger.style.minWidth).toBe('var(--tap-target-min)');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<LanguageSelector value="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
