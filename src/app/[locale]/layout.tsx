import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { AgeGate } from '@/components/ui/gate/AgeGate';
import { recordConsent } from '@/lib/age-gate/actions';
import { hasConsented } from '@/lib/age-gate/server';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { resolveActiveLocale } from '@/i18n/resolve-locale';
import { routing } from '@/i18n/routing';
import { buildBrandStyleBlock } from '@/theme/css';
import { getActiveBrand, resolveTokens } from '@/theme/resolver';
import '../globals.css';

// Self-hosted at build time by next/font (no runtime request to Google) and
// exposed as a CSS variable so the brand contract's `--font-brand` token can
// resolve to it. Weights match the set the brand type-scale uses.
const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

/** Pre-render every supported locale segment at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * `hreflang` alternates for the full supported-locale set, emitted via the
 * Next.js Metadata API (AC#8). `x-default` points at the default locale so
 * crawlers have an unambiguous fallback.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `/${locale}`]),
  );

  return {
    title: 'Storefront',
    description: 'A fast, accessible online store.',
    alternates: {
      languages: {
        ...languages,
        'x-default': `/${routing.defaultLocale}`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: routeLocale } = await params;
  if (!hasLocale(routing.locales, routeLocale)) {
    notFound();
  }

  // The active locale is a STORE-SCOPE property: resolved from Magento
  // `storeConfig.locale`, not trusted from the `[locale]` URL segment alone
  // (that segment's own validity was just checked above, against
  // `routing.locales`, itself derived from the store view — see
  // `src/i18n/locales.ts`). With exactly one store view today the two always
  // agree; this is the seam that keeps resolving correctly if a second store
  // view (with a different locale) is ever added.
  const { storeConfig } = await resolveStoreContext();
  const locale = resolveActiveLocale(storeConfig.locale);

  // Provides the locale to next-intl's server components. Note the storefront is
  // NOT statically rendered: `hasConsented()` reads a cookie below, which makes
  // every gated route dynamic by design — the storefront
  // HTML is only ever produced once consent is verified server-side.
  setRequestLocale(locale);
  const messages = await getMessages();

  // Alcohol-compliance gate: read the consent
  // cookie server-side and, when absent/invalid, render the gate IN PLACE OF the
  // storefront so no product or price HTML is ever sent. This is non-bypassable
  // with client JS disabled because the page simply does not exist in the
  // response until consent is recorded.
  const consented = await hasConsented();

  // Server-side, at render time: resolve the deployment's active brand and its
  // full token sheet, then inject the resolved CSS custom-property block so
  // every `var(--contract-name)` reference is defined on first paint.
  const activeBrand = getActiveBrand();
  const tokens = resolveTokens(activeBrand);
  const brandStyleBlock = buildBrandStyleBlock(activeBrand, tokens);

  return (
    <html lang={locale} data-brand={activeBrand} className={figtree.variable}>
      <head>
        <style id="brand-tokens" dangerouslySetInnerHTML={{ __html: brandStyleBlock }} />
      </head>
      <body data-brand={activeBrand}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {consented ? (
            children
          ) : (
            <AgeGate locale={locale} recordConsentAction={recordConsent} />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
