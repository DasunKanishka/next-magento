import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { languages } from '@/i18n/languages';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import { LanguageSelector } from './LanguageSelector';
import styles from './selectorShared.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/i18n/selectorShared.module.css',
);

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

  it('trigger carries the shared module class in both modes, meeting the tap target via the module', () => {
    const { rerender } = render(<LanguageSelector value="nl" />);
    expect(screen.getByRole('button', { name: /Taal:/ }).className).toContain(
      styles.trigger,
    );
    rerender(<LanguageSelector value="nl" compact />);
    expect(screen.getByRole('button', { name: /Taal:/ }).className).toContain(
      styles.trigger,
    );
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-height:\s*var\(--tap-target-min\)/);
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-width:\s*var\(--tap-target-min\)/);
  });

  it('wraps the option list in a labeled group', () => {
    render(<LanguageSelector value="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    expect(screen.getByRole('group', { name: 'Taal' })).toBeInTheDocument();
  });

  it('roves focus across options with ArrowDown/ArrowUp and wraps around', () => {
    render(<LanguageSelector value="nl" />);
    fireEvent.click(screen.getByRole('button', { name: /Taal:/ }));
    const menu = screen.getByRole('menu');
    const options = screen.getAllByRole('menuitemradio');

    options[0].focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(options[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(options[options.length - 1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'End' });
    expect(options[options.length - 1]).toHaveFocus();
  });

  it('the shared selector stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
