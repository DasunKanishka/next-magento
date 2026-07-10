import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('renders the current value between − and + controls', () => {
    render(<QuantityStepper value={3} onChange={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aantal verlagen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aantal verhogen' })).toBeInTheDocument();
  });

  it('defaults to the [1,99] range', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={1}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(2);
  });

  it('clamps below min to min', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={1}
        min={1}
        max={99}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verlagen' }));
    expect(next).toBe(1);
  });

  it('clamps above max to max', () => {
    let next: number | undefined;
    render(
      <QuantityStepper
        value={99}
        min={1}
        max={99}
        onChange={(n) => {
          next = n;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(99);
  });

  it('clamps to a custom [min,max] range', () => {
    let next: number | undefined;
    const onChange = (n: number) => {
      next = n;
    };
    const { rerender } = render(
      <QuantityStepper value={2} min={2} max={6} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verlagen' }));
    expect(next).toBe(2);

    rerender(<QuantityStepper value={6} min={2} max={6} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aantal verhogen' }));
    expect(next).toBe(6);
  });

  it('md and lg sizes both meet the 44×44px minimum touch target', () => {
    const { rerender } = render(
      <QuantityStepper value={1} size="md" onChange={() => {}} />,
    );
    let minusBtn = screen.getByRole('button', { name: 'Aantal verlagen' });
    expect(minusBtn.style.width).toBe('44px');
    expect(minusBtn.style.height).toBe('46px');

    rerender(<QuantityStepper value={1} size="lg" onChange={() => {}} />);
    minusBtn = screen.getByRole('button', { name: 'Aantal verlagen' });
    expect(minusBtn.style.width).toBe('46px');
    expect(minusBtn.style.height).toBe('56px');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<QuantityStepper value={1} onChange={() => {}} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
