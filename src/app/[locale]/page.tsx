import React from 'react';
import { setRequestLocale } from 'next-intl/server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  BannerTiles,
  BusinessReviews,
  CategoryBar,
  HeroSlider,
  ProductOfMonth,
  ProductRail,
  SeoContent,
} from '@/components/home';
import { getDataSource } from '@/lib/data-source';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { isSupportedLocale, type SupportedLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import { getHomeShellData } from '@/lib/home/home-data';

/** Pre-render every supported locale segment at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const sectionStack: React.CSSProperties = {
  maxWidth: 'var(--layout-maxw)',
  margin: '0 auto',
  padding: 'clamp(var(--space-5), 4vw, var(--layout-section-pad-y)) var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-section)',
};

/**
 * Storefront home page. Rendered only once the age/country gate in the locale
 * layout has recorded consent, so the header, the full section stack, and the
 * footer all live here rather than in the layout.
 *
 * The section order is fixed. The cacheable shell (navigation, editorial zones,
 * the resolved home route) comes from a single tagged read; each merchandising
 * band streams its fresh price/stock content into its own boundary.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : routing.defaultLocale;
  setRequestLocale(locale);

  // Resolve the store's configured home route and, keyed to it, the page-level
  // editorial. `data-home-route` reflects the resolved value so the configured
  // route (never a pinned id) is observable end to end.
  const shell = await getHomeShellData('home');

  // Store identity is resolved ONCE here — the highest sensible server
  // boundary above both Header and Footer — and threaded down as props so
  // neither has to re-fetch it. `getStoreIdentity()` is fail-closed for the
  // legal/identity fields (throws rather than returning a partial/defaulted
  // shape); the thrown error is caught by `src/app/[locale]/error.tsx`, which
  // replaces the whole page with a full error state rather than letting a
  // partial header/footer render with missing legal copy.
  // NOTE: keep this fetch at the page (route-segment) level. If it is hoisted
  // into `[locale]/layout.tsx` when more routes are added, `error.tsx` will no
  // longer catch the throw (a segment error boundary does not catch errors from
  // the layout at its own level) — add a `global-error.tsx` first, or the
  // fail-closed containment breaks silently.
  const { storeCode } = await resolveStoreContext();
  const identity = await getDataSource().getStoreIdentity({ storeCode });

  return (
    <div data-testid="home-page" data-home-route={shell.homeRoute}>
      <Header locale={locale} identity={identity} />

      <main>
        <h1 style={srOnly}>
          {identity.name} — {identity.tagline}
        </h1>

        <div style={sectionStack}>
          <HeroSlider slides={shell.hero} />

          <ProductRail
            slot="highlighted"
            limit={4}
            heading={shell.railHeadings.highlighted}
            variant="grid"
          />

          <CategoryBar categories={shell.categories} />

          <BusinessReviews content={shell.reviews} />

          <ProductRail
            slot="weekdeals"
            limit={6}
            heading={shell.railHeadings.weekdeals}
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners1} />

          <ProductRail
            slot="new-in"
            limit={6}
            heading={shell.railHeadings['new-in']}
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners2} />

          <ProductRail
            slot="featured"
            limit={6}
            heading={shell.railHeadings.featured}
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners3} />

          <ProductOfMonth editorial={shell.productOfMonth} />

          <SeoContent html={shell.seoHtml} stats={shell.statCallouts} />
        </div>
      </main>

      <Footer identity={identity} />
    </div>
  );
}
