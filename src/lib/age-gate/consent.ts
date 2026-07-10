import { countries, type CountryCode } from '@/i18n/countries';

/**
 * Age/country-gate consent record — the compliance-attestation payload persisted
 * in the first-party `nbns_gate` cookie.
 *
 * This module is deliberately pure (no `next/headers`, no `server-only`) so the
 * serialize/parse/validate logic is unit-testable in isolation. The
 * request-scoped read lives in `./server.ts`; the cookie write lives in the
 * Server Action `./actions.ts`.
 */

/** Cookie name — EXACT. Do not rename. */
export const COOKIE_NAME = 'nbns_gate';

/** 180-day persistence window, in seconds (cookie `max-age`). */
export const CONSENT_MAX_AGE = 15552000;

/** Same window in milliseconds — used as a defense-in-depth timestamp check. */
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE * 1000;

/**
 * The consent attestation. `ageConfirmed` is a literal `true` (never `false`):
 * a negative attestation is not a record, it is simply the absence of consent.
 */
export interface Consent {
  country: CountryCode;
  ageConfirmed: true;
  ts: number;
}

/** Narrowing guard: is a value one of the seeded delivery-country codes? */
function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && countries.some((c) => c.code === value);
}

/**
 * Encodes a fresh consent record (stamped with the current time) as a
 * base64url string suitable for a cookie value. Base64url avoids any cookie
 * delimiter characters, so no additional escaping is required.
 */
export function serializeConsent(input: {
  country: CountryCode;
  ageConfirmed: true;
}): string {
  const payload: Consent = {
    country: input.country,
    ageConfirmed: true,
    ts: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Decodes and validates a raw cookie value into a `Consent`, or returns `null`
 * if it is missing, malformed, forged, or (defense-in-depth) older than the
 * persistence window. A `null` result means "show the gate".
 */
export function parseConsentCookie(raw: string | undefined | null): Consent | null {
  if (!raw) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  let obj: unknown;
  try {
    obj = JSON.parse(decoded);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;

  const { country, ageConfirmed, ts } = obj as Record<string, unknown>;
  if (!isCountryCode(country)) return null;
  // A truthy-but-non-`true` value (e.g. "true"/1) is not an affirmative
  // attestation — require the strict boolean.
  if (ageConfirmed !== true) return null;
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
  // Even if a client forged the cookie's own max-age, refuse a stale record.
  if (Date.now() - ts > CONSENT_MAX_AGE_MS) return null;

  return { country, ageConfirmed: true, ts };
}

/** Convenience predicate over a raw cookie value: is this a valid consent? */
export function isValidConsent(raw: string | undefined | null): boolean {
  return parseConsentCookie(raw) !== null;
}
