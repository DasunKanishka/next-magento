import 'server-only';

import { sanitizeCmsHtml } from '@/lib/sanitize/cms-html';

/**
 * Server-side parsers that turn the store's structured editorial blocks into
 * typed, capped data the token-consuming home components render.
 *
 * Each block is admin-authored HTML following a documented shape (a repeated
 * wrapper element per item). Every parser first runs the raw string through the
 * shared sanitizer, then extracts plain text / link targets from the cleaned
 * markup — so the values handed to components are already trust-safe AND are
 * rendered as React text nodes (auto-escaped), never injected as markup.
 *
 * The wrapper class names below are the block shape contract: the frontend
 * expects one wrapper element per item and reads its heading / paragraphs /
 * link. Fewer items than a caller's cap is normal — parsers return exactly what
 * is present, so a partly-authored block never throws.
 */

/** A single rotating hero campaign panel. */
export interface HeroSlide {
  title: string;
  body: string;
  ctaHref: string | null;
  ctaLabel: string | null;
}

/** A single editorial banner tile. */
export interface BannerTile {
  title: string;
  body: string;
  href: string | null;
  label: string | null;
}

/** A single customer testimonial. */
export interface Testimonial {
  quote: string;
  author: string;
}

/** Aggregate satisfaction score plus a set of testimonials. */
export interface BusinessReviewsContent {
  score: string;
  basis: string;
  testimonials: Testimonial[];
}

/** Narrative copy for the product-of-the-month feature. */
export interface ProductOfMonthEditorial {
  paragraphs: string[];
}

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Decode the handful of entities the sanitizer can leave behind. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-zA-Z#0-9]+;/g, (match) => NAMED_ENTITIES[match] ?? match);
}

/** Reduce an inline HTML fragment to trimmed, entity-decoded plain text. */
function toText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every wrapper block matching a class, in document order. */
function itemBlocks(html: string, className: string): string[] {
  const re = new RegExp(
    `<div\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</div>`,
    'gi',
  );
  return Array.from(html.matchAll(re), (m) => m[1]);
}

function firstHeading(block: string): string {
  const m = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/i.exec(block);
  return m ? toText(m[2]) : '';
}

interface ParagraphNode {
  className: string;
  text: string;
}

function paragraphs(block: string): ParagraphNode[] {
  const re = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  return Array.from(block.matchAll(re), (m) => {
    const classMatch = /class="([^"]*)"/i.exec(m[1]);
    return { className: classMatch ? classMatch[1] : '', text: toText(m[2]) };
  }).filter((p) => p.text !== '');
}

function firstAnchor(block: string): { href: string; label: string } | null {
  const m = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
  return m ? { href: m[1], label: toText(m[2]) } : null;
}

function firstStrong(block: string): string {
  const m = /<strong\b[^>]*>([\s\S]*?)<\/strong>/i.exec(block);
  return m ? toText(m[1]) : '';
}

/** Parse hero panels, capped to `max`. Empty (title-and-body-less) panels drop. */
export function parseHeroSlides(
  raw: string | null | undefined,
  max: number,
): HeroSlide[] {
  const clean = sanitizeCmsHtml(raw);
  return itemBlocks(clean, 'hero-slide')
    .map((block) => {
      const cta = firstAnchor(block);
      const body = paragraphs(block)[0]?.text ?? '';
      return {
        title: firstHeading(block),
        body,
        ctaHref: cta?.href ?? null,
        ctaLabel: cta?.label ?? null,
      };
    })
    .filter((slide) => slide.title !== '' || slide.body !== '')
    .slice(0, max);
}

/** Parse banner tiles, capped to `max`. */
export function parseBannerTiles(
  raw: string | null | undefined,
  max: number,
): BannerTile[] {
  const clean = sanitizeCmsHtml(raw);
  return itemBlocks(clean, 'banner-tile')
    .map((block) => {
      const link = firstAnchor(block);
      return {
        title: firstHeading(block),
        body: paragraphs(block)[0]?.text ?? '',
        href: link?.href ?? null,
        label: link?.label ?? null,
      };
    })
    .filter((tile) => tile.title !== '' || tile.body !== '')
    .slice(0, max);
}

/** Parse the aggregate score plus testimonials (capped to `maxTestimonials`). */
export function parseBusinessReviews(
  raw: string | null | undefined,
  maxTestimonials: number,
): BusinessReviewsContent {
  const clean = sanitizeCmsHtml(raw);

  const summary = itemBlocks(clean, 'reviews-summary')[0] ?? '';
  const score = firstStrong(summary);
  const summaryText = paragraphs(summary)[0]?.text ?? '';
  const basis = score ? summaryText.replace(score, '').trim() : summaryText;

  const testimonials: Testimonial[] = itemBlocks(clean, 'review')
    .map((block) => {
      const paras = paragraphs(block);
      const author = paras.find((p) => /review-author/.test(p.className));
      const quote = paras.find((p) => !/review-author/.test(p.className));
      return {
        quote: quote?.text ?? '',
        author: author?.text ?? '',
      };
    })
    .filter((t) => t.quote !== '')
    .slice(0, maxTestimonials);

  return { score, basis, testimonials };
}

/** Parse the product-of-the-month narrative into its paragraphs. */
export function parseProductOfMonthEditorial(
  raw: string | null | undefined,
): ProductOfMonthEditorial {
  const clean = sanitizeCmsHtml(raw);
  const block = itemBlocks(clean, 'product-of-month-editorial')[0] ?? clean;
  return { paragraphs: paragraphs(block).map((p) => p.text) };
}
