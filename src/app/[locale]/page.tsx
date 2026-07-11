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
import { STORE_IDENTITY } from '@/config/store-identity';
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
  padding: 'clamp(20px, 4vw, 40px) 20px',
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

  return (
    <div data-testid="home-page" data-home-route={shell.homeRoute}>
      <Header locale={locale} />

      <main>
        <h1 style={srOnly}>
          {STORE_IDENTITY.name} — {STORE_IDENTITY.tagline}
        </h1>

        <div style={sectionStack}>
          <HeroSlider slides={shell.hero} />

          <ProductRail
            slot="highlighted"
            limit={4}
            heading="Aanbevolen voor jou"
            variant="grid"
          />

          <CategoryBar categories={shell.categories} />

          <BusinessReviews content={shell.reviews} />

          <ProductRail
            slot="weekdeals"
            limit={6}
            heading="Weekdeals"
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners1} />

          <ProductRail
            slot="new-in"
            limit={6}
            heading="Nieuw binnen"
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners2} />

          <ProductRail
            slot="featured"
            limit={6}
            heading="Uitgelichte producten"
            variant="carousel"
          />

          <BannerTiles tiles={shell.banners3} />

          <ProductOfMonth editorial={shell.productOfMonth} />

          <SeoContent html={shell.seoHtml} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
