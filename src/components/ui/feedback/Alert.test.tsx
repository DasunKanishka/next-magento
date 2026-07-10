import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Alert } from './Alert';

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

  it('tones resolve to their contract tint tokens', () => {
    const { container, rerender } = render(<Alert tone="success">x</Alert>);
    expect(container.firstElementChild).toHaveStyle({
      background: 'var(--color-cta-tint)',
    });

    rerender(<Alert tone="info">x</Alert>);
    expect(container.firstElementChild).toHaveStyle({
      background: 'var(--color-trust-tint)',
    });

    rerender(<Alert tone="error">x</Alert>);
    expect(container.firstElementChild).toHaveStyle({
      background: 'var(--color-urgency-tint)',
    });
  });

  it('renders a real, keyboard-accessible dismiss button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Alert tone="info" onClose={onClose}>
        Dismissible
      </Alert>,
    );
    const closeBtn = screen.getByRole('button', { name: 'Sluiten' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the dismiss control when onClose is not provided', () => {
    render(<Alert tone="info">Persistent</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
});
