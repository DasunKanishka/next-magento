'use client';

import React from 'react';

import { Button, TextField } from '@/components/ui';

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
 * given before the request is sent.
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
      <div
        role="status"
        style={{ font: '500 13px/1.5 var(--font-brand)', color: '#fff' }}
      >
        <strong style={{ display: 'block', marginBottom: 4 }}>Gelukt ✓</strong>
        {message}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <label
        htmlFor={`${consentId}-email`}
        style={{ font: '600 13px/1 var(--font-brand)', color: '#fff' }}
      >
        Blijf op de hoogte van aanbiedingen
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
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
      <label
        htmlFor={`${consentId}-consent`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          // Full 44px tap target for the consent toggle (the whole label row is
          // clickable and toggles the checkbox).
          minHeight: 'var(--tap-target-min)',
          font: '400 12px/1.4 var(--font-brand)',
          color: 'var(--color-text-on-brand)',
          cursor: 'pointer',
        }}
      >
        <input
          id={`${consentId}-consent`}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ width: 24, height: 24, flex: '0 0 auto' }}
        />
        Ja, ik wil de nieuwsbrief ontvangen en ga akkoord met dubbele opt-in bevestiging.
      </label>
      {state === 'error' && message ? (
        <p
          role="alert"
          style={{
            margin: 0,
            font: '500 12px/1.4 var(--font-brand)',
            color: 'var(--color-urgency)',
          }}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
