import type { TokenSheet } from '../contract';

/**
 * Concrete design values for the `default` brand — the single child brand
 * shipping in V0.1.0. Every one of the 119 contract keys (see `../contract`
 * for the reconciliation note on why 119 — the source palette's 93, the
 * accessibility-driven `--color-premium-accent-ink`, and the 25 gaps closed
 * by the v0.1.1 "M1 — Contract token-scale extension" issue) has a value
 * here. Every value is sourced 1:1 from the design specification's brand
 * token-value tables or promoted 1:1 from the component source it replaces,
 * except four adjusted to clear WCAG AA contrast (the CTA green ramp, the
 * subtle-text gray, the strikethrough gray), the added gold ink, and the
 * v0.1.1 alert `warning` tone (derived — no `warning` tone exists in
 * Alert.tsx/Toast.tsx to promote from; see the inline comment beside it).
 * The `TokenSheet` annotation makes this a compile-time-checked exhaustive
 * mapping: TypeScript rejects this object literal if any contract key is
 * missing or if an unknown key is present.
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
  // Promoted 1:1 from Button.tsx PALETTE.primary.disabledBg (the CTA
  // button's disabled-state fill).
  '--color-cta-disabled-bg': '#BBE0CC',
  '--color-urgency': '#A02C44',
  // Bright gold — reserved for on-dark accents and decorative star glyphs.
  '--color-premium-accent': '#E0982A',
  // Darker gold ink for premium-toned label text on light surfaces (the bright
  // gold above only clears AA against the navy brand background).
  '--color-premium-accent-ink': '#92631B',
  '--color-trust': '#14808A',
  '--color-trust-ink': '#0F6A72',
  '--color-surface-on-brand': '#0E2444',
  // Pinned per issue 001 — white content on a brand/navy surface. A DISTINCT
  // structural role from the muted `--color-text-on-brand` below and from
  // `--color-text-on-fill`; all three may share white in this default brand
  // yet remain independently child-overridable.
  '--color-on-brand': '#FFFFFF',
  '--color-bg-page': '#F6F8FA',
  '--color-surface': '#FFFFFF',
  '--color-surface-inset-a': '#FBFAF7',
  '--color-surface-inset-b': '#F4F1EC',
  '--color-border': '#ECE7DD',
  '--color-border-card': '#EFE9DE',
  '--color-border-field': '#D8D3CA',
  // Promoted 1:1 from Button.tsx PALETTE.tertiary.disabledBg — the neutral
  // (non-CTA) disabled-state surface, distinct from tertiary's normal
  // `#EEF1F6` fill.
  '--color-disabled-bg': '#F2F4F7',
  '--color-text-primary': '#04163A',
  '--color-text-muted': '#4A463F',
  // Darkened from the source #8A857C so subtle label text clears AA 4.5:1 on
  // the page's light surfaces (source sat at 3.7:1 on white).
  '--color-text-subtle': '#706C65',
  // Same value as `--color-text-subtle` — the design spec's own contract
  // table assigns the "Labels / meta text" role to `--color-text-subtle`
  // directly (design-spec.md's neutral-token table), so this is a promoted
  // alias for the distinct label/caption semantic role, not a new hue.
  '--color-text-label': '#706C65',
  // Promoted 1:1 from Button.tsx PALETTE — shared identically by
  // `secondary.disabledColor` and `tertiary.disabledColor` (the neutral
  // disabled-state text color; `#82B098` is the CTA-specific disabled text
  // paired with `--color-cta-disabled-bg` above and stays a component
  // literal — no token in the closed set covers it).
  '--color-disabled-fg': '#AEB6C4',
  '--color-text-on-brand': '#9AAAC0',
  '--color-text-on-brand-muted': '#5E6E86',
  // Pinned per issue 001 — on-fill text (e.g. Badge's shared `color: '#fff'`
  // on-fill exception). A distinct role from `--color-on-brand` above.
  '--color-text-on-fill': '#FFFFFF',
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
  // Alert/Toast tone inks — promoted 1:1 from Alert.tsx's TONES role-map
  // (Toast.tsx shares Alert's tint/accent tokens and has no separate ink
  // literals of its own). success/info/error are all promoted directly;
  // `warning` has no tone in Alert.tsx/Toast.tsx at all (both only support
  // success|info|error) so it is derived, not promoted — see the two
  // `warning` entries below for the derivation.
  '--color-alert-success-title': '#146B40',
  '--color-alert-success-ink': '#3E6B54',
  // Alert.tsx's `info.title` references the existing `--color-trust-ink`
  // token rather than a literal; promoted here as that token's resolved
  // value so every alert-ink key holds a concrete color.
  '--color-alert-info-title': '#0F6A72',
  '--color-alert-info-ink': '#3B6469',
  // DERIVED (no `warning` tone exists in Alert.tsx/Toast.tsx to promote
  // from): gold (`--color-premium-accent`/`-ink`) is the palette's only
  // amber/attention-adjacent hue (used for the Badge `tip` variant per the
  // design spec's "tip→gold" mapping), so the warning tone is anchored to
  // it. Title reuses the existing `--color-premium-accent-ink` value
  // (already the AA-safe gold ink for text on light surfaces — the same
  // "darker ink for the tone's hue" pattern success/info/error each follow).
  '--color-alert-warning-title': '#92631B',
  // DERIVED: body ink reuses `--color-text-subtle`'s value — the palette's
  // established warm-neutral muted text color, following the same
  // title-richer/body-more-neutral pattern the other 3 tones show (each
  // tone's body ink is a desaturated, more-neutral version of its title).
  '--color-alert-warning-ink': '#706C65',
  '--color-alert-error-title': '#8E2A40',
  '--color-alert-error-ink': '#7A3A48',
  '--pattern-photo-placeholder-a':
    'repeating-linear-gradient(40deg,#F4EDE3,#F4EDE3 7px,#EBE0D0 7px,#EBE0D0 14px)',
  '--pattern-photo-placeholder-b':
    'repeating-linear-gradient(40deg,#EDF3F0,#EDF3F0 7px,#DCE8E2 7px,#DCE8E2 14px)',
  // Promoted 1:1 from ProductCard.tsx's PLACEHOLDER_LABEL_COLOR constant.
  '--color-media-placeholder-label': '#B0926A',

  // Typography
  '--font-brand': "var(--font-figtree), system-ui, -apple-system, 'Segoe UI', sans-serif",
  '--font-mono': 'ui-monospace, Menlo, Consolas, monospace',
  // Pinned per issue 001. Standalone weight — 800 is loaded in the font
  // weight set but not assigned to a named type-scale step in the source
  // design spec (reserved headroom, e.g. a future display-black treatment;
  // design-spec.md's type-scale table note).
  '--type-weight-heavy': '800',
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
  // The design spec's type-scale table lists no line-height column for the
  // price/ui/label/eyebrow/meta rows (only size/weight, unlike
  // display/h1/h2/h3/body which list all three), so these 5 are promoted
  // from the component source instead: every occurrence of this step's
  // size/weight pairing across the component tree (PriceBlock.tsx,
  // ProductCard.tsx) uses a `/1` (unitless 1) line-height in its `font`
  // shorthand.
  '--type-price-line-height': '1',
  '--type-body-size': '15px',
  '--type-body-weight': '400',
  '--type-body-line-height': '1.65',
  '--type-ui-size': '14px',
  '--type-ui-weight': '500',
  // Promoted from component source (see the price line-height comment above
  // for why): every 14px UI/control-text occurrence across the component
  // tree (Button.tsx, SearchBar.tsx, Chip.tsx, HeaderShell.tsx, CartPill.tsx,
  // MegaMenu.tsx, MobileMenu.tsx, LanguageSelector.tsx, CountrySelector.tsx,
  // Footer.tsx) uses a `/1` line-height.
  '--type-ui-line-height': '1',
  '--type-label-size': '12px',
  '--type-label-weight': '600',
  // Promoted from component source: Badge.tsx and ProductOfMonth.tsx's
  // 12px/600 label-role text both use a `/1` line-height.
  '--type-label-line-height': '1',
  '--type-eyebrow-size': '12px',
  '--type-eyebrow-weight': '600',
  // Promoted from component source: every occurrence of text carrying
  // `--type-eyebrow-tracking` (MobileMenu.tsx, MegaMenu.tsx,
  // ProductOfMonth.tsx, selectorShared.tsx) uses a `/1` line-height.
  '--type-eyebrow-line-height': '1',
  '--type-eyebrow-tracking': '0.16em',
  '--type-tag-tracking': '0.06em',
  '--type-meta-size': '11px',
  '--type-meta-weight': '500',
  // Promoted from component source: 11px/500 meta-role text (Button.tsx's
  // `subLabel` line, ProductCard.tsx's tag-tracked brand line) uses a `/1`
  // line-height.
  '--type-meta-line-height': '1',

  // Spacing, radius, sizing & elevation
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  // Pinned per issue 001 — fills the space-scale gap between space-4 (16px)
  // and space-6 (24px); previously undefined in the source design.
  '--space-5': '20px',
  '--space-6': '24px',
  // Pinned per issue 001 — fills the space-scale gap between space-6 (24px)
  // and space-8 (32px); previously undefined in the source design.
  '--space-7': '28px',
  '--space-8': '32px',
  '--space-section': '44px',
  '--layout-maxw': '1240px',
  '--radius-xs': '5px',
  '--radius-sm': '6px',
  '--radius-md': '9px',
  '--radius-lg': '13px',
  '--radius-xl': '14px',
  '--radius-2xl': '18px',
  // Pinned per issue 001 (design-spec "Entry gate" intent per V0.1.0 issue
  // 008 — supersedes the 13px cosmetic compromise noted there).
  '--radius-gate-card': '20px',
  '--radius-full': '30px',
  '--control-height-md': '44px',
  '--control-height-lg': '56px',
  '--tap-target-min': '44px',
  // Pinned per issue 001 — the recurring media-placeholder slot height
  // (product-of-the-month / gallery-style placeholders).
  '--media-placeholder-h': '320px',
  '--border-width-default': '1px',
  '--border-width-emphasis': '1.5px',
  '--border-width-cta': '2px',
  '--shadow-card': '0 1px 3px rgba(4,22,58,.08)',
  '--shadow-raised': '0 6px 24px rgba(4,22,58,.12)',
  '--shadow-overlay': '0 16px 40px rgba(4,12,28,.18)',
  '--shadow-cta': '0 4px 16px rgba(26,133,81,.32)',
  '--focus-ring': '0 0 0 3px rgba(4,22,58,.32)',
};
