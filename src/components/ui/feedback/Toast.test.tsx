import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Toast } from './Toast';

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

  it('uses --shadow-raised and --color-border-card, sharing tint tokens with Alert', () => {
    const { container } = render(<Toast tone="info">x</Toast>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.boxShadow).toBe('var(--shadow-raised)');
    expect(el.style.border).toContain('var(--color-border-card)');
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
});
