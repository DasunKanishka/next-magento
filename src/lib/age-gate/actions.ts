'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { countries } from '@/i18n/countries';
import { defaultLocale, isSupportedLocale } from '@/i18n/locales';

import { COOKIE_NAME, CONSENT_MAX_AGE, serializeConsent } from './consent';

/**
 * `recordConsent` Server Action — records the age-gate consent. Bound directly
 * to the gate `<form>` so submission works with client JavaScript disabled
 * (progressive enhancement); the typed input is transported as `FormData`,
 * which is how a Server Action receives a form.
 *
 * The gate is a legal/compliance control, so the client is never trusted: the
 * cookie is written ONLY when a known delivery country is present AND 18+ is
 * affirmatively confirmed, both re-validated here on the server. On any
 * outcome the action re-renders the locale route — a valid submission causes
 * the layout's `hasConsented()` check to pass and reveal the storefront; an
 * invalid one leaves no cookie, so the gate re-renders unchanged.
 */
export async function recordConsent(formData: FormData): Promise<void> {
  const countryRaw = formData.get('country');
  const ageConfirmed = formData.get('ageConfirmed');
  const localeRaw = formData.get('locale');

  const locale =
    typeof localeRaw === 'string' && isSupportedLocale(localeRaw)
      ? localeRaw
      : defaultLocale;

  const country = countries.find((c) => c.code === countryRaw)?.code;

  if (country && ageConfirmed === 'true') {
    const store = await cookies();
    store.set(COOKIE_NAME, serializeConsent({ country, ageConfirmed: true }), {
      // NOT httpOnly — this is a UX/compliance-attestation record, not a
      // security credential: it carries no token and grants no backend access,
      // and a Server Component reads it during the initial render. Server-side
      // enforcement means clearing or forging it only re-triggers the gate.
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: CONSENT_MAX_AGE,
      path: '/',
    });
  }

  redirect(`/${locale}`);
}
