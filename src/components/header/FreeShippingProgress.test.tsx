import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { FreeShippingProgress } from './FreeShippingProgress';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/header/FreeShippingProgress.module.css',
);

describe('FreeShippingProgress', () => {
  it('invites the visitor toward the threshold at an empty cart', () => {
    render(<FreeShippingProgress cartTotal={0} />);
    expect(screen.getByText(/Nog €150,00 tot gratis bezorging/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('confirms free shipping once the threshold is reached', () => {
    render(<FreeShippingProgress cartTotal={200} />);
    expect(screen.getByText(/Je hebt gratis bezorging/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<FreeShippingProgress cartTotal={75} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways across the reached/unreached states', () => {
    const notReached = render(<FreeShippingProgress cartTotal={0} />);
    const reached = render(<FreeShippingProgress cartTotal={200} />);
    const elements = [
      ...notReached.container.querySelectorAll('div'),
      ...reached.container.querySelectorAll('div'),
    ];
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
