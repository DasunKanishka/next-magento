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
 *
 * Scale-coverage addendum (total now 119, color 54, typography 35, spacing/
 * radius/sizing 30): a component-styling audit surfaced 25 further gaps —
 * component literals with no matching token to point at, which would
 * otherwise stay orphaned and un-overridable by a child brand. This batch:
 * fills the two previously-undefined space-scale steps called out above
 * (`--space-5`, `--space-7`); adds the recurring media-placeholder height;
 * adds the 5 type-scale line-heights left undefined for the
 * price/ui/label/eyebrow/meta steps (promoted from the line-height each
 * step's text consistently uses in the component source, since the source
 * tables never list a line-height column for these 5 rows); adds a
 * standalone heavy weight (not step-scoped — used by wordmarks/stat-figures
 * that map to no named type step); adds an on-fill text color, a 3-token
 * disabled-state group, 8 alert-tone ink colors (4 tones × title/body), 2
 * label-role colors, and 2 folded structural follow-ups (`--color-on-brand`,
 * `--radius-gate-card`). This file stays values-free (keys only); each new
 * value's provenance is tracked outside the source tree.
 * `--color-on-brand-strong` was considered and intentionally dropped — no
 * concrete definition exists for it anywhere in the source material, and an
 * undefined token is itself a smell.
 *
 * Caption-size addendum (total now 120, typography 36): a recurring 13px
 * label/meta font-size used across the component tree had no matching
 * token, leaving a child brand unable to override it. `--type-caption-size`
 * closes that gap per the extend-vs-snap rule below (a scale-step gap
 * between the 14px UI size and the 12px label size). Standalone — no
 * accompanying weight or line-height token, matching the precedent set by
 * `--type-weight-heavy` above.
 *
 * Interactive-surface & disabled-pair addendum (total now 127, color 60,
 * spacing/radius/sizing 31): promotes the last raw component literals in the
 * button exemplar into the contract so a child brand can override them — all
 * 1:1 promotions with no rendered-value change. Adds a neutral
 * interactive-surface family for the non-CTA (secondary/tertiary) button
 * fills: `--color-surface-neutral` is the shared resting tint (the tertiary
 * fill at rest AND the secondary fill on hover — one value, two consumers),
 * with `-hover` and `-active` for the tertiary fill's deepening states and
 * `-emphasis` for the secondary fill's pressed tint. Adds
 * `--color-cta-disabled-fg`, the disabled CTA label color paired with the
 * existing `--color-cta-disabled-bg` (the pair was previously split — bg a
 * token, fg a literal). Adds `--color-border-disabled`, the disabled control
 * border, sibling of `--color-disabled-bg`/`-fg`. Adds `--control-height-sm`
 * (36px), the small control height, sibling of `--control-height-md`/`-lg`;
 * 36px sits more than the snap tolerance below the 44px md height, so per the
 * extend-vs-snap rule below it earns a token rather than snapping.
 *
 * Generic-weight addendum (total now 129, typography 38): the button exemplar
 * carried its control weights (700/600) as raw numerics. Rather than borrow an
 * unrelated named type step's weight token (which would mis-couple a control's
 * weight to, say, the price or label role), two standalone weight primitives
 * were added — `--type-weight-bold` (700) and `--type-weight-semibold` (600) —
 * mirroring the `--type-weight-heavy` precedent for weights that map to no
 * named type-scale step. 1:1 promotion, no rendered-value change.
 *
 * Header/nav literal-closure addendum (total now 139, color 61, typography 39,
 * spacing/radius/sizing 39): a header/nav styling pass adopted a strict
 * no-literal-anywhere policy, promoting the last raw values in the header,
 * mega-menu, drawer, cart and button exemplar into the contract so a child
 * brand can override every one. All 1:1 promotions (no rendered-value change)
 * except the two header min-heights, promoted at their EXACT source values
 * (previously carried as ~4–6px approximations, now zero-drift). Adds:
 * `--color-scrim`, the modal/drawer backdrop ink (the compact-drawer variant;
 * named so a stronger-alpha sibling can join later without a rename); a
 * mega-menu column-width family `--mega-rail-w`/`--mega-col-w`/`--mega-promo-w`
 * (left rail / subtype column / promo column); `--menu-drawer-w`, the mobile
 * drawer width; `--media-thumb-h`, a compact media-thumbnail height (sibling of
 * `--media-placeholder-h`, scaled for an inline tile rather than a full slot);
 * `--header-logo-h` and `--header-nav-h`, the header logo-row and nav-row
 * min-heights; `--icon-size-md`, a reusable icon-glyph size primitive (a text
 * size token is semantically wrong for an icon); and `--type-underline-offset`,
 * the link underline offset (previously a structural-constant carve-out in the
 * button exemplar, now a token under the no-literal policy).
 */

export const COLOR_CONTRACT_KEYS = [
  '--color-brand',
  '--color-brand-ink',
  '--color-cta',
  '--color-cta-hover',
  '--color-cta-active',
  '--color-cta-disabled-bg',
  '--color-cta-disabled-fg',
  '--color-urgency',
  '--color-premium-accent',
  '--color-premium-accent-ink',
  '--color-trust',
  '--color-trust-ink',
  '--color-surface-on-brand',
  '--color-on-brand',
  '--color-bg-page',
  '--color-surface',
  '--color-surface-inset-a',
  '--color-surface-inset-b',
  '--color-surface-neutral',
  '--color-surface-neutral-hover',
  '--color-surface-neutral-active',
  '--color-surface-neutral-emphasis',
  '--color-border',
  '--color-border-card',
  '--color-border-field',
  '--color-border-disabled',
  '--color-disabled-bg',
  '--color-text-primary',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-text-label',
  '--color-disabled-fg',
  '--color-text-on-brand',
  '--color-text-on-brand-muted',
  '--color-text-on-fill',
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
  '--color-alert-success-title',
  '--color-alert-success-ink',
  '--color-alert-info-title',
  '--color-alert-info-ink',
  '--color-alert-warning-title',
  '--color-alert-warning-ink',
  '--color-alert-error-title',
  '--color-alert-error-ink',
  '--pattern-photo-placeholder-a',
  '--pattern-photo-placeholder-b',
  '--color-media-placeholder-label',
  // Modal/drawer backdrop ink (compact-drawer variant). Named without an
  // alpha/emphasis suffix so a stronger sibling (e.g. a full-screen overlay)
  // can be added later without renaming this one.
  '--color-scrim',
] as const;

export const TYPOGRAPHY_CONTRACT_KEYS = [
  '--font-brand',
  '--font-mono',
  // Standalone weight primitives — intentionally NOT step-scoped (a
  // `--type-{step}-weight` name would be wrong here). `-heavy` is used for
  // wordmarks and stat-figures that map to no named type-scale step; `-bold`
  // and `-semibold` are generic control/label weights for elements (e.g.
  // buttons) whose weight belongs to no single type step, so they must not
  // borrow another step's weight token.
  '--type-weight-heavy',
  '--type-weight-bold',
  '--type-weight-semibold',
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
  '--type-price-line-height',
  '--type-body-size',
  '--type-body-weight',
  '--type-body-line-height',
  '--type-ui-size',
  '--type-ui-weight',
  '--type-ui-line-height',
  // Caption/label text size — a systemic 13px value; see the extend-vs-snap rule below.
  '--type-caption-size',
  '--type-label-size',
  '--type-label-weight',
  '--type-label-line-height',
  '--type-eyebrow-size',
  '--type-eyebrow-weight',
  '--type-eyebrow-line-height',
  '--type-eyebrow-tracking',
  '--type-tag-tracking',
  '--type-meta-size',
  '--type-meta-weight',
  '--type-meta-line-height',
  // Link/underline offset — the small legibility gap between text and its
  // underline. Maps to no type step; a standalone typographic primitive.
  '--type-underline-offset',
] as const;

/**
 * Extend-vs-snap rule (canonical statement — later additions and downstream
 * batches reference this comment rather than restating the thresholds):
 * a novel off-scale value earns a NEW token when it is systemic — a
 * scale-step gap (fills a hole between two existing steps), OR a
 * ≥3-distinct-file recurrence, OR a structural role (a value that names a
 * component-level concept, not just a number). Otherwise, snap the value to
 * the nearest existing token: ≤2px of drift is an acceptable snap; >2px of
 * drift must escalate (re-open the contract to add a token) rather than
 * silently absorbing a new systemic value or leaving a literal in a
 * component.
 */
export const SPACING_CONTRACT_KEYS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-7',
  '--space-8',
  '--space-section',
  '--layout-maxw',
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-gate-card',
  '--radius-full',
  '--control-height-sm',
  '--control-height-md',
  '--control-height-lg',
  '--tap-target-min',
  '--media-placeholder-h',
  // Compact media-thumbnail height — sibling of --media-placeholder-h, scaled
  // for an inline promo tile rather than a full-width gallery slot.
  '--media-thumb-h',
  // Reusable icon-glyph size primitive (medium). Icons recur across
  // components; a text-size token is semantically wrong for an icon.
  '--icon-size-md',
  // Mega-menu column widths: left rail / subtype column / promo column.
  '--mega-rail-w',
  '--mega-col-w',
  '--mega-promo-w',
  // Mobile navigation drawer width.
  '--menu-drawer-w',
  // Header row min-heights: logo row / nav row.
  '--header-logo-h',
  '--header-nav-h',
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
