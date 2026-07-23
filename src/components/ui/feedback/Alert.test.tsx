import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { Alert } from './Alert';
import styles from './Alert.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/feedback/Alert.module.css',
);

describe('Alert', () => {
  it('renders all three documented tones with title + body', () => {
    render(
      <>
        <Alert tone="success" title="Gelukt">
          Toegevoegd aan winkelmandje.
        </Alert>
        <Alert tone="info" title="Let op">
          Nog 3 op voorraad.
        </Alert>
        <Alert tone="error" title="Mislukt">
          Probeer het opnieuw.
        </Alert>
      </>,
    );
    expect(screen.getByText('Gelukt')).toBeInTheDocument();
    expect(screen.getByText('Let op')).toBeInTheDocument();
    expect(screen.getByText('Mislukt')).toBeInTheDocument();
  });

  it('tones bridge their fill to the contract tint tokens', () => {
    const { container, rerender } = render(<Alert tone="success">x</Alert>);
    const el = () => container.firstElementChild as HTMLElement;
    expect(el().style.getPropertyValue('--local-bg')).toBe('var(--color-cta-tint)');

    rerender(<Alert tone="info">x</Alert>);
    expect(el().style.getPropertyValue('--local-bg')).toBe('var(--color-trust-tint)');

    rerender(<Alert tone="error">x</Alert>);
    expect(el().style.getPropertyValue('--local-bg')).toBe('var(--color-urgency-tint)');
  });

  it('renders a real, keyboard-accessible dismiss button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Alert tone="info" onClose={onClose}>
        Dismissible
      </Alert>,
    );
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the dismiss control when onClose is not provided', () => {
    render(<Alert tone="info">Persistent</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries its module class on the root banner', () => {
    const { container } = render(<Alert tone="info">x</Alert>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      styles.alert,
    );
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <>
        <Alert tone="success" title="A" onClose={() => {}}>
          x
        </Alert>
        <Alert tone="info" title="B">
          y
        </Alert>
        <Alert tone="error" title="C">
          z
        </Alert>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the tone + dismiss surface', () => {
    const success = render(
      <Alert tone="success" title="A" onClose={() => {}}>
        x
      </Alert>,
    );
    const info = render(
      <Alert tone="info" title="B">
        y
      </Alert>,
    );
    const error = render(<Alert tone="error">z</Alert>);
    const elements = [
      ...success.container.querySelectorAll('div'),
      ...info.container.querySelectorAll('div'),
      ...error.container.querySelectorAll('div'),
    ];
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('token-swap: overriding the per-tone alert-ink tokens flows to the banner that binds them', () => {
    const overrideTitle = 'rgb(11, 22, 33)';
    const overrideBody = 'rgb(44, 55, 66)';

    // Baseline: the success banner inherits the brand alert-ink values.
    const base = renderWithBrandTokens(
      <Alert tone="success" title="Gelukt">
        Toegevoegd
      </Alert>,
    );
    const baseEl = base.getByRole('status');
    expect(resolvedToken(baseEl, '--color-alert-success-title')).toBe(
      defaultTokens['--color-alert-success-title'],
    );
    base.unmount();

    // Override the tokens on an ancestor; the resolved values follow.
    const over = renderWithBrandTokens(
      <Alert tone="success" title="Gelukt">
        Toegevoegd
      </Alert>,
      {
        '--color-alert-success-title': overrideTitle,
        '--color-alert-success-ink': overrideBody,
      },
    );
    const overEl = over.getByRole('status');
    expect(resolvedToken(overEl, '--color-alert-success-title')).toBe(overrideTitle);
    expect(resolvedToken(overEl, '--color-alert-success-ink')).toBe(overrideBody);

    // Wiring: the banner element carries the bridge props bound to those tokens,
    // so an override necessarily changes the painted title/body inks.
    expect(overEl.style.getPropertyValue('--local-title-ink')).toBe(
      'var(--color-alert-success-title)',
    );
    expect(overEl.style.getPropertyValue('--local-body-ink')).toBe(
      'var(--color-alert-success-ink)',
    );
  });
});
