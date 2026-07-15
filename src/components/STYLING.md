# Component styling convention

This library styles components with **per-component CSS Modules that consume
only design tokens**, plus a small inline "bridge" for values that vary at
runtime. This document is precise enough that two developers following it
produce the same structure. `ui/core/Button.tsx` + `ui/core/Button.module.css`
are the canonical reference — copy their shape.

No styling dependency is used: Next.js compiles `*.module.css` natively. Do not
add Tailwind, a CSS-in-JS runtime, or any other styling library.

## The two value sources

A rendered component may reference values from exactly two places:

1. **Design tokens** — the CSS custom properties declared by the token
   contract (`src/theme/contract.ts`), each written as `var(--token)`. Their
   concrete values come from the active brand and are therefore overridable per
   brand. Prefer these for everything.
2. **Bridge properties** — custom properties named `--local-*`, set inline by
   the component, and consumed as `var(--local-*)` in the module. These carry
   the values that cannot be static because they depend on a prop.

## File layout

- Co-locate the stylesheet with its component: `Component.tsx` +
  `Component.module.css` in the same directory.
- Import it as `import styles from './Component.module.css'` and attach classes
  with `className={styles.foo}`.

## What goes in the `.module.css`

- Every declaration value is either a `var(--token)` (a contract token) or a
  `var(--local-*)` (a bridge property). **No brand-value literals** — no hex
  colors, font names, `px` dimensions, shadows, gradients, or radii. If a value
  like that is needed, it is either a token (use it) or it flows in through the
  bridge.
- Structural constants that a brand would never re-theme may be written
  directly: layout keywords (`display`, `flex-direction`, `inline-flex`,
  `center`, `100%`, `auto`, `none`, `transparent`), transition timing, and
  `opacity`. Media-query conditions (e.g. `@media (max-width: 900px)`) are also
  written directly — CSS forbids `var()` inside a media condition, so a
  breakpoint is a responsive mechanic, not a themeable value. Two further
  mechanics belong to this same carve-out: `z-index` integers (a stacking-order
  index — a child brand never needs to override which layer a panel paints on,
  so it is a mechanic, not a design value) and the viewport-relative middle term
  of a `clamp()` (`vw`/`vh`, e.g. `clamp(var(--space-6), 4vw, var(--space-section))`)
  — the viewport unit is itself the fluid-scaling mechanic CSS provides; only
  the clamp's min/max _endpoints_ are design values and so those still must be
  `var(--token)`. This is a narrow list — a color, any dimension (spacing,
  size, width, height), or a typographic value (font-size, weight, offset) is
  a design value and gets a token; it is never a "structural constant".
- `line-height` is a design value: use its token whenever one exists (the
  contract carries a `line-height` for every named type step, so a control that
  maps to a type step should reference that token, e.g.
  `line-height: var(--type-ui-line-height)`). Write a raw unitless line-height
  only when no type-step token applies.
- Anything that needs a rule set rather than a single property **must** live
  here, never inline: state selectors (`:hover`, `:active`, `:disabled`,
  `:focus-visible`), structural selectors (`:has()`, `::placeholder`,
  `::before`), and media queries. An inline style cannot express any of these.
- Handle interactive states with pseudo-class selectors on the base class
  (e.g. `.button:hover:not(:disabled)`), not with a component state variable.

## What goes inline (the bridge) — the hard rule

An inline `style={{}}` may set **only `--local-*` custom properties**. It must
never set a direct CSS property to a literal value (e.g. `background: '#fff'`
or `height: '44px'` are both forbidden inline).

- **A bridge value must itself be a token reference — `var(--token)` — never a
  raw brand-value literal (hex color, `px`/`rem` dimension, font family, shadow,
  or radius).** Parking such a literal in a value map or `const` and routing it
  through the bridge is forbidden: it merely hides the literal from the
  stylesheet while leaving it un-overridable by a brand. This is the one hole
  the convention exists to close, so there is no exception. Example:
  `style={{ '--local-height': 'var(--control-height-md)' }}`, consumed in the
  module as `height: var(--local-height)`.
- If the contract has no token for a value you need, you have exactly three
  options — never a bridged literal: (a) add a token to the contract (extend
  `src/theme/contract.ts` and every brand sheet in lockstep) and reference it;
  (b) snap to the nearest existing token within the 2px tolerance below; or
  (c) if it is genuinely a structural constant a brand would never re-theme
  (see the module section), write it directly in the module — do not route it
  through the bridge.
- The consumer-facing `style` prop is spread last so a caller can still tune a
  component; callers are held to the same rule (only `--local-*`).

### `--local-*` naming

Name bridge properties for the role they fill, not the component — so the
pattern reads the same across components. Use the painted property or state as
the suffix, kebab-case: `--local-bg`, `--local-fg`, `--local-border`,
`--local-height`, `--local-pad-x`, `--local-font-size`; add a state suffix for
interactive variants (`--local-bg-hover`, `--local-bg-active`,
`--local-bg-disabled`, `--local-fg-disabled`). Keep the base role first and the
state last.

## Snapping off-scale values

If a component's source value is close to an existing token but not exact, snap
it to the nearest token when the difference is within 2px, and record the
adjustment in a comment (e.g. `22px → --space-6 (24px, +2px)`). If the nearest
token is more than 2px away, do not silently absorb the difference and do not
bridge the raw value: add a token to the contract (and every brand sheet, in
lockstep) so the value is overridable, then reference it.

## Checklist for a new component

1. Create `Component.module.css`; put static token references and all state /
   structural rules there.
2. Route prop-driven values through `--local-*` bridge properties; use token
   values wherever a token exists.
3. Keep the inline `style` limited to `--local-*` properties only.
4. Add a test that reads the `.module.css` and asserts it references only real
   tokens and bridge properties (`expectModuleCssReferencesRealTokens`).
5. Add a bridge-consistency test that cross-checks, in both directions, that
   every `--local-*` the component sets is consumed by the module and vice versa
   (`expectBridgePropsConsistent`), rendering every variant so the union of set
   properties is complete.
6. Add a token-swap test proving a consumed token is overridable
   (`renderWithBrandTokens` + `resolvedToken`).
7. Add a className-wiring assertion: jsdom does not apply module CSS to
   computed styles, so a dropped `className` currently passes every test above
   silently. Import the module's `styles` object in the test and assert the
   rendered element carries it, e.g.
   `expect(el.className).toContain(styles.wrap)` — never a hardcoded string,
   since the module's exported key is the only stable handle once class names
   are hashed.
