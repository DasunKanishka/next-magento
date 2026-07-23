import { describe, expect, it } from 'vitest';

import {
  parseBannerTiles,
  parseBusinessReviews,
  parseHeroSlides,
  parseProductOfMonthEditorial,
  parseStatCallouts,
} from './editorial';

const HERO = `
<div class="hero-slide">
  <h2>Zomerse borrel, feestelijke prijzen</h2>
  <p>Ontdek onze zomercollectie wijnen &ndash; geselecteerd om te vieren.</p>
  <a href="/zomerdeals" class="cta-button">Shop de zomerdeals</a>
</div>
<div class="hero-slide">
  <h2>Nieuw binnen: ambachtelijke gins</h2>
  <p>Proef de nieuwste gins in ons assortiment.</p>
  <a href="/nieuw" class="cta-button">Bekijk het nieuwe aanbod</a>
</div>`;

const REVIEWS = `
<div class="reviews-summary">
  <p><strong>4,7 van de 5</strong> op basis van 1.284 beoordelingen</p>
</div>
<div class="review">
  <p>&quot;Snelle levering en de wijn was precies wat ik zocht.&quot;</p>
  <p class="review-author">&mdash; Marieke, Utrecht</p>
</div>
<div class="review">
  <p>&quot;Goed advies gekregen via de chat.&quot;</p>
  <p class="review-author">&mdash; Bas, Rotterdam</p>
</div>`;

describe('parseHeroSlides', () => {
  it('extracts title, body, and cta for each panel and decodes entities', () => {
    const slides = parseHeroSlides(HERO, 5);
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe('Zomerse borrel, feestelijke prijzen');
    expect(slides[0].body).toContain('wijnen – geselecteerd');
    expect(slides[0].ctaHref).toBe('/zomerdeals');
    expect(slides[0].ctaLabel).toBe('Shop de zomerdeals');
  });

  it('caps the number of panels returned', () => {
    expect(parseHeroSlides(HERO, 1)).toHaveLength(1);
  });

  it('returns an empty list for empty input without throwing', () => {
    expect(parseHeroSlides('', 5)).toEqual([]);
    expect(parseHeroSlides(null, 5)).toEqual([]);
  });

  it('strips any injected script while keeping the panel text', () => {
    const malicious =
      '<div class="hero-slide"><h2>Veilig<script>alert(1)</script></h2><p>ok</p></div>';
    const slides = parseHeroSlides(malicious, 5);
    expect(slides[0].title).toBe('Veilig');
    expect(JSON.stringify(slides)).not.toContain('alert(1)');
  });
});

describe('parseBannerTiles', () => {
  it('extracts heading, body, and link and respects the cap', () => {
    const raw = `
      <div class="banner-tile"><h3>Outlet</h3><p>Scherp geprijsd.</p><a href="/outlet">Naar de outlet</a></div>
      <div class="banner-tile"><h3>Cadeaus</h3><p>Verras iemand.</p><a href="/cadeaus">Bekijk</a></div>
      <div class="banner-tile"><h3>Advies</h3><p>Wij helpen.</p><a href="/advies">Vraag advies</a></div>`;
    const tiles = parseBannerTiles(raw, 2);
    expect(tiles).toHaveLength(2);
    expect(tiles[0]).toMatchObject({
      title: 'Outlet',
      href: '/outlet',
      label: 'Naar de outlet',
    });
  });
});

describe('parseBusinessReviews', () => {
  it('splits the aggregate score from its basis line', () => {
    const { score, basis } = parseBusinessReviews(REVIEWS, 3);
    expect(score).toBe('4,7 van de 5');
    expect(basis).toBe('op basis van 1.284 beoordelingen');
  });

  it('extracts quote and author for each testimonial, capped', () => {
    const { testimonials } = parseBusinessReviews(REVIEWS, 1);
    expect(testimonials).toHaveLength(1);
    expect(testimonials[0].quote).toContain('Snelle levering');
    expect(testimonials[0].author).toContain('Marieke, Utrecht');
  });

  it('degrades to empty structure when nothing is authored', () => {
    expect(parseBusinessReviews('', 3)).toEqual({
      score: '',
      basis: '',
      testimonials: [],
    });
  });
});

describe('parseProductOfMonthEditorial', () => {
  it('returns the narrative paragraphs', () => {
    const raw =
      '<div class="product-of-month-editorial"><p>Fris witbier &euro;34,95.</p><p>Tweede alinea.</p></div>';
    const { paragraphs } = parseProductOfMonthEditorial(raw);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toContain('€34,95');
  });
});

describe('parseStatCallouts', () => {
  const RAW = `
    <div class="stat-callout"><strong>8.000+</strong><p>producten op voorraad</p></div>
    <div class="stat-callout"><strong>4,8 &#9733;</strong><p>gemiddelde klantbeoordeling</p></div>
    <div class="stat-callout"><strong>Morgen in huis</strong><p>bij bestelling voor 22:00</p></div>`;

  it('extracts the figure and label for each callout, capped', () => {
    const stats = parseStatCallouts(RAW, 2);
    expect(stats).toHaveLength(2);
    expect(stats[0]).toEqual({ value: '8.000+', label: 'producten op voorraad' });
    expect(stats[1].value).toBe('4,8 ★');
  });

  it('drops a callout with no figure', () => {
    const raw = '<div class="stat-callout"><p>geen waarde</p></div>';
    expect(parseStatCallouts(raw, 3)).toEqual([]);
  });

  it('returns an empty list for empty/unauthored input without throwing (empty-backend invariant)', () => {
    expect(parseStatCallouts('', 3)).toEqual([]);
    expect(parseStatCallouts(null, 3)).toEqual([]);
    expect(parseStatCallouts(undefined, 3)).toEqual([]);
  });
});
