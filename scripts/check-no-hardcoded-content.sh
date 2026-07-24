#!/usr/bin/env bash
#
# Anti-regression guard: no hardcoded store-identity/content in the frontend.
#
# Issues 004/005 moved every user-facing store-identity string (store name,
# tagline, registration number, legal entity, payment-method labels, footer
# columns, delivery-promise copy) OUT of the frontend and into
# `getStoreIdentity()` (backend/CMS-sourced, see
# `src/config/store-identity-content.ts`). This guard fails the build if any
# of those exact pre-migration literals reappears — the regression this guard
# exists to catch is someone hand-typing the old constant back into a
# component instead of threading the sourced `identity` prop through.
#
# ── SCOPE — READ BEFORE TRUSTING A GREEN RUN ────────────────────────────────
# This is a CURATED, KNOWN-LITERAL guard, not a general "no hardcoded prose"
# detector:
#   1. The SURFACE denylist check below scans only the enumerated content
#      surfaces (header + footer components, src/config/**) for the curated
#      DENYLIST of exact pre-migration literals.
#   2. The BRAND-TOKEN check greps the whole shipped frontend (src/**, docs/**,
#      .env.example, README.md) for the 4 core brand identifiers, so a brand
#      string can't leak in through an untracked surface either.
#   3. The ROOT-ARTIFACT brand-token check (widened, constitution v1.4.0)
#      greps EVERY tracked file in the repo (`git ls-files -- ':(top)*'`) for
#      the same 4 identifiers, so a brand string can't leak in through any new
#      root-level artifact either — a strictly wider superset of pass 2.
# Arbitrary NEW prose reintroducing store content in different wording (e.g. a
# rewritten tagline, a differently-worded delivery promise) is UNDETECTABLE by
# this script — this is the documented complement to the Reviewer's concrete-
# content grep during code review, not a claim of total coverage. Two
# properties are distinct: this guard catches CONCRETE, ALREADY-KNOWN real
# content; it says nothing about placeholders (`TBD`, `TODO`, "implement
# later") — that is Iron-Law-7's separate placeholder scan, and passing THIS
# guard is not evidence of passing THAT one (see the guard's self-test).
#
# Test files (`*.test.ts(x)` / `*.spec.ts(x)`) are OUT OF SCOPE for BOTH
# checks below, mirroring `check-no-hardcoded-style-literals.sh`'s convention.
# Reasoning: a test fixture legitimately exercises the mapper/component with
# sample data shaped like real backend content (e.g. asserting the delivery
# copy renders verbatim) — that is correctness testing, not shipped hardcoded
# content, and scanning it would force either brittle fixture rewrites with no
# safety benefit or a weakened (word-only) pattern that stops catching real
# regressions. The one-time exception was genericizing the handful of test
# fixtures that carried this repo's OWN real brand strings (mappers.test.ts) —
# done once, directly, not by teaching this guard to tolerate them.
#
# ── MAINTAINED SURFACE + DENYLIST LIST ──────────────────────────────────────
# This block is the single source of truth for "what surfaces are covered"
# and "what exact literal reintroduces a known regression". EXTEND IT the
# moment a new content surface (e.g. a new header/footer sub-component, a new
# `src/config/*-content.ts` module) or a new brand identifier is introduced —
# an unlisted surface or literal is invisible to this guard.
set -euo pipefail

# Optional: point the guard at a different project root (used by the guard's
# own self-test, which plants fixtures in a throwaway temp dir OUTSIDE this
# repo). Defaults to the real repo root when run normally / via `pnpm check:*`.
BASE="${1:-.}"

# Enumerated content surfaces (non-test files only — see SCOPE above).
# `src/components/home` + `src/app` were added by issue 001 (V0.1.4): the
# hardcoded `SeoContent` stat-callout regression (C1) shipped green precisely
# because this guard did not scan the home surface at all (H2) — the home
# page (`src/app/**/page.tsx`) and its components are now in scope too.
SURFACE_DIRS=(
  "$BASE/src/components/header"
  "$BASE/src/components/footer"
  "$BASE/src/components/home"
  "$BASE/src/app"
  "$BASE/src/config"
)

# Curated denylist: exact strings that existed in the frontend BEFORE issues
# 004/005 moved them to `getStoreIdentity()`. Matched as FIXED strings
# (grep -F), not regexes — these are literal historical values, not patterns.
# A couple of entries are deliberately shaped like the source-code property
# they used to be part of (`heading: '...'`) rather than the bare word, so a
# generic future use of the same everyday word (e.g. a new column literally
# named "Klantenservice" is unlikely, but a stray aria-label containing that
# word is plausible) does not false-positive — see the self-test's
# non-content case.
DENYLIST=(
  # Store name (also the prefix of the legal-entity string below).
  'TopDrinks'
  # Legal entity named in the copyright line.
  'TopDrinks B.V.'
  # Brand tagline (whole-block admin-authorable content, pre-migration).
  'Jouw online drankspeciaalzaak — 8.000+ premium dranken, morgen in huis.'
  # Chamber-of-Commerce registration number.
  'KvK 87654321'
  # Unified delivery-promise copy (search trust line / countdown / mobile strip).
  'Voor 22:00 besteld, morgen in huis'
  # Payment-method names AS A HARDCODED ARRAY (quoted-literal form, matching
  # how `const PAYMENT_METHODS = [...]` used to declare them). Third-party
  # payment-network names are otherwise legitimate and NOT brand content — see
  # the brand-token scan below, which deliberately excludes them.
  "'iDEAL'"
  "'Visa'"
  "'Mastercard'"
  "'PayPal'"
  # Footer column headings (property-shaped, matching the old COLUMNS array's
  # literal source form — NOT a bare-word match, so an unrelated future string
  # containing "Klantenservice"/"Assortiment" in prose does not trip this).
  "heading: 'Assortiment'"
  "heading: 'Klantenservice'"
  # Home `SeoContent` stat-callout proof points (issue 001, V0.1.4): the exact
  # pre-migration STAT_CALLOUTS literals, hardcoded regardless of backend
  # state (defect C1) before being moved to the `home_stat_callouts` CMS block
  # via `getEditorialContent` (see `src/lib/home/home-data.ts`).
  "'8.000+'"
  "'4,8 ★'"
  "'Morgen in huis'"
  # JUDGMENT CALL: the pre-migration COLUMNS array also carried per-link
  # `href`/`label` pairs (e.g. `/whisky`, `/verzending`, `/over-ons`). Those
  # are deliberately NOT denylisted here: several of those exact route paths
  # are legitimate, unrelated header config today (e.g. `DEALS_HREF =
  # '/aanbiedingen'` in navConfig.ts) — denylisting them would false-positive
  # on genuine non-content routing config in the very same surface. The
  # heading literals above are the higher-signal, collision-free marker of a
  # COLUMNS-array regression; a reintroduced link without its heading would
  # still very likely reintroduce the heading too.
)

# Brand-token scan (constitution v1.3.0): the 4 core store-content brand
# identifiers, grepped across the whole SHIPPED frontend + docs, not just the
# enumerated surfaces above — so a brand string leaking in through an
# unlisted file (e.g. a stray SEO/meta constant) is still caught. Deliberately
# narrower than DENYLIST: it excludes payment-network names (iDEAL/Visa/… are
# generic third-party examples, not this store's brand) and the project/repo
# name `next-bns` (the project identifier, not store content) is simply never
# listed here.
BRAND_TOKENS=(
  'TopDrinks'
  'TopDrinks B.V.'
  'KvK 87654321'
  'Jouw online drankspeciaalzaak — 8.000+ premium dranken, morgen in huis.'
)
# ── END MAINTAINED SURFACE + DENYLIST LIST ──────────────────────────────────

violations=()

# ---- 1. Surface denylist scan (enumerated surfaces, non-test files) -------
mapfile -t SURFACE_FILES < <(
  find "${SURFACE_DIRS[@]}" -type f \
    \( -name '*.ts' -o -name '*.tsx' \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.next/*' \
    -not -name '*.test.ts' -not -name '*.test.tsx' \
    -not -name '*.spec.ts' -not -name '*.spec.tsx' \
    2>/dev/null | sort
)

for f in "${SURFACE_FILES[@]}"; do
  for lit in "${DENYLIST[@]}"; do
    hit=$(grep -Fn -- "$lit" "$f" 2>/dev/null || true)
    if [ -n "$hit" ]; then
      while IFS= read -r line; do
        violations+=("$f — hardcoded content literal '$lit': $line")
      done <<<"$hit"
    fi
  done
done

# ---- 2. Brand-token scan (shipped frontend + docs, non-test files) --------
mapfile -t BRAND_FILES < <(
  find "$BASE/src" -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/.next/*' \
    -not -name '*.test.*' -not -name '*.spec.*' \
    2>/dev/null | sort
)
if [ -d "$BASE/docs" ]; then
  mapfile -t DOC_FILES < <(find "$BASE/docs" -type f 2>/dev/null | sort)
  BRAND_FILES+=("${DOC_FILES[@]}")
fi
for extra in "$BASE/.env.example" "$BASE/README.md"; do
  if [ -f "$extra" ]; then
    BRAND_FILES+=("$extra")
  fi
done

for f in "${BRAND_FILES[@]}"; do
  for tok in "${BRAND_TOKENS[@]}"; do
    hit=$(grep -Fn -- "$tok" "$f" 2>/dev/null || true)
    if [ -n "$hit" ]; then
      while IFS= read -r line; do
        violations+=("$f — brand token '$tok' shipped in frontend/docs: $line")
      done <<<"$hit"
    fi
  done
done

# ---- 3. Root-artifact brand-token scan (widened, constitution v1.4.0) -----
# The two scans above are path-enumerated (SURFACE_DIRS / src+docs+2 files).
# This third pass scans EVERY tracked file in the repo (`git ls-files --
# ':(top)*'` — the `:(top)` pathspec magic anchors matching to the repo root
# regardless of the caller's cwd, so this stays correct however the script is
# invoked) for the same BRAND_TOKENS, so a brand string can never smuggle in
# through a new root-level artifact (a stray README variant, a committed
# config file, a rogue script) that neither of the two scans above happens to
# cover. Self-reference exception: this guard's own file and any *.test.*/
# *.spec.* fixture (e.g. mappers.test.ts's legitimate sample data) are
# excluded, same convention as the rest of this guard.
mapfile -t ALL_TRACKED_FILES < <(
  git -C "$BASE" ls-files -- ':(top)*' 2>/dev/null \
    | grep -vE '^scripts/check-no-hardcoded-content\.sh$' \
    | grep -vE '\.test\.|\.spec\.' \
    | sort
)
for f in "${ALL_TRACKED_FILES[@]}"; do
  path="$BASE/$f"
  [ -f "$path" ] || continue
  for tok in "${BRAND_TOKENS[@]}"; do
    hit=$(grep -Fn -- "$tok" "$path" 2>/dev/null || true)
    if [ -n "$hit" ]; then
      while IFS= read -r line; do
        violations+=("$f — brand token '$tok' shipped in a tracked repo file: $line")
      done <<<"$hit"
    fi
  done
done

if [ "${#violations[@]}" -gt 0 ]; then
  echo "✖ Hardcoded store-identity content found — content must be sourced from"
  echo "  getStoreIdentity(), not hardcoded back into the frontend."
  echo "  Offending literals:"
  printf '    %s\n' "${violations[@]}"
  exit 1
fi

echo "✔ No hardcoded store-identity content — content-sourcing guard satisfied."
