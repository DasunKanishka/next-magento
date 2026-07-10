import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { countries } from '@/i18n/countries';
import { languages } from '@/i18n/languages';
import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { CountrySelector } from './CountrySelector';

describe('CountrySelector', () => {
  it('renders the full trigger with the "Bezorgen naar" label + country name', () => {
    render(<CountrySelector value="NL" />);
    const trigger = screen.getByRole('button', { name: /Bezorgland: Nederland/ });
    expect(within(trigger).getByText('Bezorgen naar')).toBeInTheDocument();
    expect(within(trigger).getByText('Nederland')).toBeInTheDocument();
  });

  it('compact mode omits the label (flag + chevron only)', () => {
    render(<CountrySelector value="NL" compact />);
    expect(screen.queryByText('Bezorgen naar')).not.toBeInTheDocument();
    // Trigger still present and reachable.
    expect(
      screen.getByRole('button', { name: /Bezorgland: Nederland/ }),
    ).toBeInTheDocument();
  });

  it('opens a two-column dropdown listing all 7 countries and all 6 languages', () => {
    render(<CountrySelector value="NL" language="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    const menu = screen.getByRole('menu', { name: 'Land en taal' });

    // Exact-text lookups avoid substring collisions between country/language
    // names (e.g. "Duits" vs "Duitsland", "Nederland" vs "Nederlands").
    for (const c of countries) {
      expect(within(menu).getByText(c.name)).toBeInTheDocument();
    }
    for (const l of languages) {
      expect(within(menu).getByText(l.name)).toBeInTheDocument();
    }
  });

  it('marks the active country (left) and active language (right) as checked', () => {
    render(<CountrySelector value="FR" language="fr" />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    expect(screen.getByRole('menuitemradio', { name: /Frankrijk/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: /Frans/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('closes on country selection and reports the chosen code', () => {
    const onCountryChange = vi.fn();
    render(<CountrySelector value="NL" onCountryChange={onCountryChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Duitsland/ }));
    expect(onCountryChange).toHaveBeenCalledWith('DE');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on language selection and reports the chosen locale', () => {
    const onLanguageChange = vi.fn();
    render(
      <CountrySelector value="NL" language="nl" onLanguageChange={onLanguageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Spaans/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('es');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<CountrySelector value="NL" />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <button type="button">buiten</button>
        <CountrySelector value="NL" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'buiten' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger meets the 44×44px minimum tap target in both modes', () => {
    const { rerender } = render(<CountrySelector value="NL" />);
    let trigger = screen.getByRole('button', { name: /Bezorgland/ });
    expect(trigger.style.minHeight).toBe('var(--tap-target-min)');
    expect(trigger.style.minWidth).toBe('var(--tap-target-min)');

    rerender(<CountrySelector value="NL" compact />);
    trigger = screen.getByRole('button', { name: /Bezorgland/ });
    expect(trigger.style.minHeight).toBe('var(--tap-target-min)');
    expect(trigger.style.minWidth).toBe('var(--tap-target-min)');
  });

  it('alignLeft anchors the dropdown to the left edge', () => {
    const { container } = render(<CountrySelector value="NL" alignLeft />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    const menu = within(container).getByRole('menu');
    expect(menu.style.left).toBe('0px');
    expect(menu.style.right).toBe('');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<CountrySelector value="NL" language="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Bezorgland/ }));
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
