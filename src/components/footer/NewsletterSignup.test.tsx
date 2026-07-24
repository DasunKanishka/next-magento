import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  expectAllVarTokensAreContractKeys,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { NewsletterSignup } from './NewsletterSignup';
import styles from './NewsletterSignup.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/footer/NewsletterSignup.module.css',
);

afterEach(() => {
  vi.restoreAllMocks();
});

function fillEmail(value: string) {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value } });
}

describe('NewsletterSignup', () => {
  it('renders an email field, a consent checkbox, and a subscribe button', () => {
    render(<NewsletterSignup />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('rejects an invalid email without calling the endpoint', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<NewsletterSignup />);
    fillEmail('not-an-email');
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires consent before submitting', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<NewsletterSignup />);
    fillEmail('you@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/consent/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts to the endpoint and shows the confirmation state on success', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'subscribed' }), { status: 200 }),
      );
    render(<NewsletterSignup />);
    fillEmail('you@example.com');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/bff/newsletter',
      expect.objectContaining({ method: 'POST' }),
    );
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'you@example.com',
      consent: true,
    });
  });

  it('shows an error state when the endpoint reports failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'error' }), { status: 200 }),
    );
    render(<NewsletterSignup />);
    fillEmail('you@example.com');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/failed/i);
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<NewsletterSignup />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('carries its module class on the form', () => {
    const { container } = render(<NewsletterSignup />);
    expect(container.querySelector('form')?.className).toContain(styles.form);
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
