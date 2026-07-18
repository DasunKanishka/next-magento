import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LocaleError from './error';

/**
 * Covers the fail-closed path this boundary exists for:
 * `getStoreIdentity()` throws (a legal/identity field is unsourceable) rather
 * than ever return a partial/defaulted identity, and Next.js renders this
 * segment error boundary IN PLACE OF the page — never a partial page with a
 * missing/empty legal line.
 */
describe('LocaleError', () => {
  it('renders a full error state instead of any page content', () => {
    const error = Object.assign(new Error('store-identity:fail-closed field=name'), {
      digest: 'test-digest',
    });
    render(<LocaleError error={error} reset={() => {}} />);

    expect(
      screen.getByText('De pagina kan op dit moment niet worden weergegeven.', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument();
  });

  it('logs the thrown error for observability without rendering its detail', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('store-identity:fail-closed field=copyright'), {
      digest: 'test-digest',
    });
    render(<LocaleError error={error} reset={() => {}} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(screen.queryByText(/fail-closed/)).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('invokes reset when the retry button is activated', () => {
    const reset = vi.fn();
    const error = Object.assign(
      new Error('store-identity:fail-closed field=registrationNumber'),
      {
        digest: 'test-digest',
      },
    );
    render(<LocaleError error={error} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
