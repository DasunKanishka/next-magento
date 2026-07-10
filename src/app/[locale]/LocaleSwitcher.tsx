'use client';

import React from 'react';

import { CountrySelector, LanguageSelector } from '@/components/ui';
import { defaultCountryCode, findCountry, type CountryCode } from '@/i18n/countries';
import type { SupportedLocale } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * Client-side locale/country switcher wiring the two selector components to
 * next-intl navigation. Changing the language navigates to that locale;
 * changing the country adopts the country's natural default language. The
 * current path is preserved across the locale swap.
 */
export function LocaleSwitcher({ locale }: { locale: SupportedLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [country, setCountry] = React.useState<CountryCode>(defaultCountryCode);

  function goTo(nextLocale: SupportedLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <CountrySelector
        value={country}
        language={locale}
        onCountryChange={(code) => {
          setCountry(code);
          const nextLocale = findCountry(code)?.defaultLocale;
          if (nextLocale && nextLocale !== locale) goTo(nextLocale);
        }}
        onLanguageChange={(nextLocale) => {
          if (nextLocale !== locale) goTo(nextLocale);
        }}
      />
      <LanguageSelector
        value={locale}
        onLanguageChange={(nextLocale) => {
          if (nextLocale !== locale) goTo(nextLocale);
        }}
      />
    </div>
  );
}
