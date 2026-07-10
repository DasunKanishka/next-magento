import { describe, expect, it } from 'vitest';

import {
  CONSENT_MAX_AGE,
  COOKIE_NAME,
  isValidConsent,
  parseConsentCookie,
  serializeConsent,
} from './consent';

describe('age-gate consent cookie', () => {
  it('uses the exact cookie name and 180-day max-age from the security spec', () => {
    expect(COOKIE_NAME).toBe('nbns_gate');
    expect(CONSENT_MAX_AGE).toBe(15552000);
  });

  it('round-trips a valid consent record', () => {
    const raw = serializeConsent({ country: 'NL', ageConfirmed: true });
    const parsed = parseConsentCookie(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.country).toBe('NL');
    expect(parsed?.ageConfirmed).toBe(true);
    expect(typeof parsed?.ts).toBe('number');
    expect(isValidConsent(raw)).toBe(true);
  });

  it('treats a missing/empty cookie as no consent', () => {
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie(null)).toBeNull();
    expect(parseConsentCookie('')).toBeNull();
    expect(isValidConsent(undefined)).toBe(false);
  });

  it('rejects a malformed / non-base64 / non-JSON cookie', () => {
    expect(parseConsentCookie('not-base64-@@@')).toBeNull();
    expect(
      parseConsentCookie(Buffer.from('not json', 'utf8').toString('base64url')),
    ).toBeNull();
  });

  it('rejects an unknown country code', () => {
    const forged = Buffer.from(
      JSON.stringify({ country: 'US', ageConfirmed: true, ts: Date.now() }),
      'utf8',
    ).toString('base64url');
    expect(parseConsentCookie(forged)).toBeNull();
  });

  it('rejects a non-affirmative age flag', () => {
    const forged = Buffer.from(
      JSON.stringify({ country: 'NL', ageConfirmed: 'true', ts: Date.now() }),
      'utf8',
    ).toString('base64url');
    expect(parseConsentCookie(forged)).toBeNull();
  });

  it('rejects a record older than the persistence window', () => {
    const stale = Buffer.from(
      JSON.stringify({
        country: 'NL',
        ageConfirmed: true,
        ts: Date.now() - (CONSENT_MAX_AGE * 1000 + 1000),
      }),
      'utf8',
    ).toString('base64url');
    expect(parseConsentCookie(stale)).toBeNull();
  });
});
