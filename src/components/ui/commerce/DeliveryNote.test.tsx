import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import { DeliveryNote } from './DeliveryNote';
import styles from './DeliveryNote.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/commerce/DeliveryNote.module.css',
);

// `title` has no default (the store's actual promise is backend-sourced
// content, see `DeliveryNoteProps.title`) — every render call supplies one
// explicitly, as a real caller would.
const TEST_TITLE = 'Voor 22:00 besteld, morgen in huis';

describe('DeliveryNote', () => {
  it('renders the supplied title', () => {
    render(<DeliveryNote title={TEST_TITLE} />);
    expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
  });

  it('renders the countdown and threshold by default', () => {
    render(<DeliveryNote title={TEST_TITLE} />);
    expect(screen.getByText('5u 42m')).toBeInTheDocument();
    expect(screen.getByText(/Gratis vanaf €150/)).toBeInTheDocument();
  });

  it('omits the countdown clause entirely when countdown is null', () => {
    render(
      <DeliveryNote title={TEST_TITLE} countdown={null} threshold="Gratis vanaf €150" />,
    );
    expect(screen.queryByText(/om vandaag te bestellen/)).not.toBeInTheDocument();
    expect(screen.getByText('Gratis vanaf €150')).toBeInTheDocument();
  });

  it('accepts a custom title, countdown and threshold', () => {
    render(
      <DeliveryNote
        title="Voor 20:00 besteld"
        countdown="2u 10m"
        threshold="Gratis vanaf €75"
      />,
    );
    expect(screen.getByText('Voor 20:00 besteld')).toBeInTheDocument();
    expect(screen.getByText('2u 10m')).toBeInTheDocument();
    expect(screen.getByText(/Gratis vanaf €75/)).toBeInTheDocument();
  });

  it('wires the module classes for the wrap, icon, title and body', () => {
    const { container } = render(<DeliveryNote title={TEST_TITLE} />);
    expect(container.querySelector(`.${styles.wrap}`)).not.toBeNull();
    expect(container.querySelector('svg')?.getAttribute('class')).toContain(styles.icon);
    expect(container.querySelector(`.${styles.title}`)?.textContent).toBe(TEST_TITLE);
    expect(container.querySelector(`.${styles.body}`)).not.toBeNull();
  });

  // DeliveryNote is fully static (title/countdown/threshold are text
  // content, not styling props): every token reference lives in the
  // co-located module, not inline, so there is no rendered var(--*) to check
  // here — the module-CSS test below covers token validity instead.
  it('the co-located stylesheet references only real tokens (no --local-* bridge — fully static)', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
