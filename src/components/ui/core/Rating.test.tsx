import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Rating } from './Rating';

describe('Rating', () => {
  it('renders rounded star fill, score, and review count', () => {
    render(<Rating value={4.6} score={4.6} count={12000} />);
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('12000 reviews')).toBeInTheDocument();
  });

  it('omits score/count when not provided', () => {
    render(<Rating value={5} />);
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });

  it('clamps value to the 0–5 range', () => {
    const { container: over, unmount: unmountOver } = render(<Rating value={7} />);
    expect(over.querySelector('[aria-hidden]')?.textContent).toBe('★★★★★');
    unmountOver();

    const { container: under } = render(<Rating value={-2} />);
    expect(under.querySelector('[aria-hidden]')?.textContent).toBe('☆☆☆☆☆');
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<Rating value={4.8} score={4.8} count={12000} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
