import type { TokenSheet } from '../contract';

/**
 * Concrete design values for the `default` brand — the single child brand
 * shipping in V0.1.0. Every one of the 94 contract keys (see `../contract`
 * for the reconciliation note on why 94 — the source palette's 93 plus the
 * accessibility-driven `--color-premium-accent-ink`) has a value here. Every
 * value is sourced 1:1 from the design specification's brand token-value
 * tables, except four adjusted to clear WCAG AA contrast (the CTA green ramp,
 * the subtle-text gray, the strikethrough gray) and the added gold ink. The
 * `TokenSheet` annotation makes this a compile-time-checked exhaustive mapping:
 * TypeScript rejects this object literal if any contract key is missing or if
 * an unknown key is present.
 */
export const defaultTokens: TokenSheet = {
  // Color
  '--color-brand': '#04163A',
  '--color-brand-ink': '#03122E',
  // CTA green darkened from the source #1C8F57 so BOTH white-on-green (button
  // fills) and green-on-white (inline trust copy) clear WCAG AA 4.5:1 — the
  // source value sat at 4.1:1 in both directions.
  '--color-cta': '#1A8551',
  '--color-cta-hover': '#167246',
  '--color-cta-active': '#13613B',
  '--color-urgency': '#A02C44',
  // Bright gold — reserved for on-dark accents and decorative star glyphs.
  '--color-premium-accent': '#E0982A',
  // Darker gold ink for premium-toned label text on light surfaces (the bright
  // gold above only clears AA against the navy brand background).
  '--color-premium-accent-ink': '#92631B',
  '--color-trust': '#14808A',
  '--color-trust-ink': '#0F6A72',
  '--color-surface-on-brand': '#0E2444',
  '--color-bg-page': '#F6F8FA',
  '--color-surface': '#FFFFFF',
  '--color-surface-inset-a': '#FBFAF7',
  '--color-surface-inset-b': '#F4F1EC',
  '--color-border': '#ECE7DD',
  '--color-border-card': '#EFE9DE',
  '--color-border-field': '#D8D3CA',
  '--color-text-primary': '#04163A',
  '--color-text-muted': '#4A463F',
  // Darkened from the source #8A857C so subtle label text clears AA 4.5:1 on
  // the page's light surfaces (source sat at 3.7:1 on white).
  '--color-text-subtle': '#706C65',
  '--color-text-on-brand': '#9AAAC0',
  '--color-text-on-brand-muted': '#5E6E86',
  '--color-text-placeholder': '#9A958C',
  // Darkened from the source #9AAAC0 so struck-through prices remain legible
  // (meaningful text) at AA on light surfaces (source sat at 2.4:1).
  '--color-text-strikethrough': '#636E7C',
  '--color-cta-tint': '#ECF6F0',
  '--color-cta-tint-border': '#CDE8DA',
  '--color-trust-tint': '#E9F3F4',
  '--color-trust-tint-border': '#C7E2E4',
  '--color-trust-chip': '#E6F2F3',
  '--color-trust-chip-border': '#CDE0E2',
  '--color-urgency-tint': '#FBEFF2',
  '--color-urgency-tint-border': '#F0D3DA',
  '--color-urgency-chip': '#FBEAEA',
  '--color-info': '#EEF2F7',
  '--color-info-border': '#D5DEEA',
  '--color-info-ink': '#3A5A78',
  '--pattern-photo-placeholder-a':
    'repeating-linear-gradient(40deg,#F4EDE3,#F4EDE3 7px,#EBE0D0 7px,#EBE0D0 14px)',
  '--pattern-photo-placeholder-b':
    'repeating-linear-gradient(40deg,#EDF3F0,#EDF3F0 7px,#DCE8E2 7px,#DCE8E2 14px)',

  // Typography
  '--font-brand': "var(--font-figtree), system-ui, -apple-system, 'Segoe UI', sans-serif",
  '--font-mono': 'ui-monospace, Menlo, Consolas, monospace',
  '--type-display-size': '52px',
  '--type-display-weight': '700',
  '--type-display-line-height': '1.04',
  '--type-h1-size': '38px',
  '--type-h1-weight': '600',
  '--type-h1-line-height': '1.1',
  '--type-h2-size': '30px',
  '--type-h2-weight': '600',
  '--type-h2-line-height': '1.1',
  '--type-h3-size': '22px',
  '--type-h3-weight': '600',
  '--type-h3-line-height': '1.1',
  '--type-price-size': '18px',
  '--type-price-weight': '700',
  '--type-body-size': '15px',
  '--type-body-weight': '400',
  '--type-body-line-height': '1.65',
  '--type-ui-size': '14px',
  '--type-ui-weight': '500',
  '--type-label-size': '12px',
  '--type-label-weight': '600',
  '--type-eyebrow-size': '12px',
  '--type-eyebrow-weight': '600',
  '--type-eyebrow-tracking': '0.16em',
  '--type-tag-tracking': '0.06em',
  '--type-meta-size': '11px',
  '--type-meta-weight': '500',

  // Spacing, radius, sizing & elevation
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-6': '24px',
  '--space-8': '32px',
  '--space-section': '44px',
  '--layout-maxw': '1240px',
  '--radius-xs': '5px',
  '--radius-sm': '6px',
  '--radius-md': '9px',
  '--radius-lg': '13px',
  '--radius-xl': '14px',
  '--radius-2xl': '18px',
  '--radius-full': '30px',
  '--control-height-md': '44px',
  '--control-height-lg': '56px',
  '--tap-target-min': '44px',
  '--border-width-default': '1px',
  '--border-width-emphasis': '1.5px',
  '--border-width-cta': '2px',
  '--shadow-card': '0 1px 3px rgba(4,22,58,.08)',
  '--shadow-raised': '0 6px 24px rgba(4,22,58,.12)',
  '--shadow-overlay': '0 16px 40px rgba(4,12,28,.18)',
  '--shadow-cta': '0 4px 16px rgba(26,133,81,.32)',
  '--focus-ring': '0 0 0 3px rgba(4,22,58,.32)',
};
