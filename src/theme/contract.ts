/**
 * Neutral parent token contract.
 *
 * This module declares the *names* of every semantic design token the
 * product exposes to components. It carries ZERO concrete design values —
 * no hex colors, no font names, no copy, no numeric defaults, and no
 * fallback values of any kind. Every value is supplied exclusively by a
 * brand's `TokenSheet` (see `./brands/*`); a CI check
 * (`scripts/check-contract-neutral.sh`, `pnpm check:contract-neutral`) greps
 * this file for brand-value literals and fails the build if any are found.
 *
 * Naming reconciliation note (read before changing key counts):
 * The source design specification's token-contract tables use a compact
 * "grouped" notation for readability — e.g. one table row covering a single
 * type-scale step's `-size` / `-weight` / `-line-height` suffixes, and one
 * row covering the entire `space-1 .. space-8` scale. Each grouped row is
 * expanded here into one independent CSS custom property per suffix/step,
 * because a single CSS custom property can only ever hold one value — a
 * heading's size, weight, and line-height are three independently-settable
 * properties in the rendered stylesheet even though the source table
 * displays them as one row. Expanding every grouped row this way (and
 * limiting the space scale to the 6 steps the source design actually
 * delivers values for — steps 1/2/3/4/6/8; steps 5 and 7 are not defined
 * anywhere in the source) yields exactly 93 distinct contract keys: 38
 * color + 29 typography + 26 spacing/radius/sizing/elevation. This is the
 * same total the source specification's own "raw token count" arithmetic
 * independently arrives at (38 + 29 + 26 = 93 raw source tokens, stated to
 * map completely into the parent contract) — it differs from a separate
 * "37 + 12 + 21 = 70" row-count total quoted elsewhere in the same source
 * document's summary prose, which undercounts its own tables by one row in
 * both the color section (which literally lists 38 rows) and the
 * typography section (which literally lists 13 rows) before any grouped-row
 * expansion is even applied. 93 is the count actually implementable as
 * distinct, independently-valued CSS custom properties; this deviation from
 * the "70" figure is intentional and is called out explicitly wherever this
 * contract is consumed or tested.
 *
 * Accessibility addendum (total now 94, color now 39): one token beyond the
 * source palette — `--color-premium-accent-ink` — was added so the gold
 * premium accent has a readable variant for text on light surfaces. The bright
 * `--color-premium-accent` clears AA only against the dark brand background
 * (where it is used for on-navy accents and decorative star glyphs); a single
 * gold value cannot satisfy both a dark and a light background at once, so a
 * darker ink shade is required for gold-toned label text. This mirrors the
 * existing `-ink` pairings (`--color-brand`/`--color-brand-ink`,
 * `--color-trust`/`--color-trust-ink`).
 */

export const COLOR_CONTRACT_KEYS = [
  '--color-brand',
  '--color-brand-ink',
  '--color-cta',
  '--color-cta-hover',
  '--color-cta-active',
  '--color-urgency',
  '--color-premium-accent',
  '--color-premium-accent-ink',
  '--color-trust',
  '--color-trust-ink',
  '--color-surface-on-brand',
  '--color-bg-page',
  '--color-surface',
  '--color-surface-inset-a',
  '--color-surface-inset-b',
  '--color-border',
  '--color-border-card',
  '--color-border-field',
  '--color-text-primary',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-text-on-brand',
  '--color-text-on-brand-muted',
  '--color-text-placeholder',
  '--color-text-strikethrough',
  '--color-cta-tint',
  '--color-cta-tint-border',
  '--color-trust-tint',
  '--color-trust-tint-border',
  '--color-trust-chip',
  '--color-trust-chip-border',
  '--color-urgency-tint',
  '--color-urgency-tint-border',
  '--color-urgency-chip',
  '--color-info',
  '--color-info-border',
  '--color-info-ink',
  '--pattern-photo-placeholder-a',
  '--pattern-photo-placeholder-b',
] as const;

export const TYPOGRAPHY_CONTRACT_KEYS = [
  '--font-brand',
  '--font-mono',
  '--type-display-size',
  '--type-display-weight',
  '--type-display-line-height',
  '--type-h1-size',
  '--type-h1-weight',
  '--type-h1-line-height',
  '--type-h2-size',
  '--type-h2-weight',
  '--type-h2-line-height',
  '--type-h3-size',
  '--type-h3-weight',
  '--type-h3-line-height',
  '--type-price-size',
  '--type-price-weight',
  '--type-body-size',
  '--type-body-weight',
  '--type-body-line-height',
  '--type-ui-size',
  '--type-ui-weight',
  '--type-label-size',
  '--type-label-weight',
  '--type-eyebrow-size',
  '--type-eyebrow-weight',
  '--type-eyebrow-tracking',
  '--type-tag-tracking',
  '--type-meta-size',
  '--type-meta-weight',
] as const;

export const SPACING_CONTRACT_KEYS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-6',
  '--space-8',
  '--space-section',
  '--layout-maxw',
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-full',
  '--control-height-md',
  '--control-height-lg',
  '--tap-target-min',
  '--border-width-default',
  '--border-width-emphasis',
  '--border-width-cta',
  '--shadow-card',
  '--shadow-raised',
  '--shadow-overlay',
  '--shadow-cta',
  '--focus-ring',
] as const;

/** Every contract key, in stable declaration order. */
export const CONTRACT_TOKEN_NAMES = [
  ...COLOR_CONTRACT_KEYS,
  ...TYPOGRAPHY_CONTRACT_KEYS,
  ...SPACING_CONTRACT_KEYS,
] as const;

export type ContractTokenName = (typeof CONTRACT_TOKEN_NAMES)[number];

/** A complete, brand-resolved set of values for every contract key. */
export type TokenSheet = Record<ContractTokenName, string>;
