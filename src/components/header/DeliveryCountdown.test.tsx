import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { DeliveryCountdown } from './DeliveryCountdown';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/header/DeliveryCountdown.module.css',
);

describe('DeliveryCountdown', () => {
  it('renders a polite live region referencing the next-day promise', () => {
    render(
      <DeliveryCountdown copy="Voor 22:00 besteld, morgen in huis" cutoffHour={22} />,
    );
    const region = screen.getByText(/tomorrow/);
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
