import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { Toast } from './Toast';
import styles from './Toast.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/feedback/Toast.module.css',
);

describe('Toast', () => {
  it('renders all three documented tones', () => {
    render(
      <>
        <Toast tone="success">Toegevoegd aan winkelmandje</Toast>
        <Toast tone="info">Prijs bijgewerkt</Toast>
        <Toast tone="error">Kon niet toevoegen</Toast>
      </>,
    );
    expect(screen.getByText('Toegevoegd aan winkelmandje')).toBeInTheDocument();
    expect(screen.getByText('Prijs bijgewerkt')).toBeInTheDocument();
    expect(screen.getByText('Kon niet toevoegen')).toBeInTheDocument();
  });

  it('announces itself politely for assistive tech (role=status, aria-live=polite)', () => {
    render(<Toast tone="success">Gelukt</Toast>);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('bridges the per-tone icon-circle colors to Alert-shared tint/accent tokens', () => {
    const { container, rerender } = render(<Toast tone="success">x</Toast>);
    const el = () => container.firstElementChild as HTMLElement;
    expect(el().style.getPropertyValue('--local-tint')).toBe('var(--color-cta-tint)');
    expect(el().style.getPropertyValue('--local-accent')).toBe('var(--color-cta)');

    rerender(<Toast tone="info">x</Toast>);
    expect(el().style.getPropertyValue('--local-tint')).toBe('var(--color-trust-tint)');
  });

  it('uses --shadow-raised and the --color-border-card frame via the module', () => {
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/\.toast\s*\{[\s\S]*?box-shadow:\s*var\(--shadow-raised\)/);
    expect(css).toMatch(
      /\.toast\s*\{[\s\S]*?border:\s*var\(--border-width-default\) solid var\(--color-border-card\)/,
    );
  });

  it('carries its module class on the root pill', () => {
    const { container } = render(<Toast tone="info">x</Toast>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      styles.toast,
    );
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <>
        <Toast tone="success">A</Toast>
        <Toast tone="info">B</Toast>
        <Toast tone="error">C</Toast>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the tone surface', () => {
    const success = render(<Toast tone="success">A</Toast>);
    const info = render(<Toast tone="info">B</Toast>);
    const error = render(<Toast tone="error">C</Toast>);
    const elements = [
      ...success.container.querySelectorAll('div'),
      ...info.container.querySelectorAll('div'),
      ...error.container.querySelectorAll('div'),
    ];
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
