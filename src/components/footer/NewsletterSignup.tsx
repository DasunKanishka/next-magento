'use client';

import React from 'react';

import { Button, TextField } from '@/components/ui';
import styles from './NewsletterSignup.module.css';

type SubmitState = 'idle' | 'submitting' | 'subscribed' | 'error';

export interface NewsletterSignupProps {
  /** Endpoint the signup posts to. Defaults to the first-party newsletter route. */
  endpoint?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Footer newsletter signup — email field, consent checkbox, and subscribe
 * button. Posts to the first-party newsletter route, which proxies the backend
 * subscribe; the double opt-in confirmation email is handled entirely by the
 * backend. Renders a subscribed/error result to the visitor. Consent must be
 * given before the request is sent. Styling lives in the co-located CSS module
 * (see src/components/STYLING.md).
 */
export function NewsletterSignup({
  endpoint = '/api/bff/newsletter',
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [state, setState] = React.useState<SubmitState>('idle');
  const [message, setMessage] = React.useState('');
  const consentId = React.useId();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setState('error');
      setMessage('Vul een geldig e-mailadres in.');
      return;
    }
    if (!consent) {
      setState('error');
      setMessage('Geef toestemming om je in te schrijven.');
      return;
    }

    setState('submitting');
    setMessage('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), consent: true }),
      });
      const data = (await res.json().catch(() => null)) as { status?: string } | null;
      if (res.ok && data?.status === 'subscribed') {
        setState('subscribed');
        setMessage(
          'Bijna klaar! Bevestig je inschrijving via de e-mail die we net stuurden.',
        );
      } else {
        setState('error');
        setMessage('Inschrijven is niet gelukt. Probeer het later opnieuw.');
      }
    } catch {
      setState('error');
      setMessage('Inschrijven is niet gelukt. Probeer het later opnieuw.');
    }
  }

  if (state === 'subscribed') {
    return (
      <div role="status" className={styles.status}>
        <strong className={styles.statusStrong}>Gelukt ✓</strong>
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <label htmlFor={`${consentId}-email`} className={styles.label}>
        Blijf op de hoogte van aanbiedingen
      </label>
      <div className={styles.row}>
        <div className={styles.field}>
          <TextField
            id={`${consentId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jij@voorbeeld.nl"
            aria-label="E-mailadres"
            aria-invalid={state === 'error'}
          />
        </div>
        <Button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Bezig…' : 'Inschrijven'}
        </Button>
      </div>
      <label htmlFor={`${consentId}-consent`} className={styles.consent}>
        <input
          id={`${consentId}-consent`}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className={styles.checkbox}
        />
        Ja, ik wil de nieuwsbrief ontvangen en ga akkoord met dubbele opt-in bevestiging.
      </label>
      {state === 'error' && message ? (
        <p role="alert" className={styles.error}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
