#!/usr/bin/env bash
#
# Repo-hygiene guard: no internal planning/process vocabulary in the source.
#
# This is a public, standalone code repository. Code comments, test names, and
# identifiers must describe behavior in repo-local terms — they must NOT leak
# the upstream planning process's internal vocabulary (governance-doc names,
# requirement/spec identifiers, work-item/story IDs, internal doc filenames, or
# operator/tooling names). Those references mean nothing to a reader of this
# repo and expose internal process detail.
#
# Scans hand-written source only (src/, e2e/). Generated code, localized content
# catalogs, vendored deps, and this scripts/ dir (which holds the patterns
# themselves) are excluded. Two passes: a case-insensitive set of unambiguous
# internal terms, and a case-sensitive set for patterns that would false-positive
# in ordinary prose if matched case-insensitively (e.g. an uppercase "MUST 3"
# requirement tag vs. the ordinary word "must").
#
# If this guard ever flags a legitimate token, rephrase the comment to describe
# the behavior directly — do not weaken the pattern to sneak a reference through.
set -euo pipefail

ROOTS=(src e2e)

COMMON_EXCLUDES=(
  --exclude-dir=node_modules
  --exclude-dir=.next
  --exclude-dir=.git
  --exclude-dir=gql        # generated GraphQL documents
  --exclude=*.json         # localized content catalogs / data
  --exclude=*.snap
)

# Case-INSENSITIVE: unambiguous internal terms that have no business in this repo.
# Deliberately excludes ambiguous phrases that are legitimate in a public repo —
# e.g. "the design spec" (a design-deliverable reference), "checklist item" (a
# plausible UI concept) — to avoid false positives; only distinctly-internal
# governance/process/requirement/operator vocabulary is guarded.
CI_PATTERN='constitution|\bPRD\b|\bAFK\b|iron law|drakula|alucard|vampirecave|\bissue 0[0-9][0-9]\b'

# Case-SENSITIVE: requirement tags and work-item/story IDs. Kept case-sensitive so
# ordinary lowercase prose ("it must 3x") and unrelated tokens are not flagged.
CS_PATTERN='\b(MUST|SHOULD) [0-9]|\b[AH]-[0-9]{2}\b'

ci_hits=$(grep -rInE "$CI_PATTERN" "${ROOTS[@]}" "${COMMON_EXCLUDES[@]}" --exclude-dir=scripts 2>/dev/null || true)
cs_hits=$(grep -rEn "$CS_PATTERN" "${ROOTS[@]}" "${COMMON_EXCLUDES[@]}" --exclude-dir=scripts 2>/dev/null || true)

hits=$(printf '%s\n%s\n' "$ci_hits" "$cs_hits" | grep -vE '^$' || true)

if [ -n "$hits" ]; then
  echo "✖ Internal planning vocabulary found in source — this is a public repo."
  echo "  Describe behavior in repo-local terms; do not reference internal"
  echo "  governance docs, spec/requirement/issue IDs, or process/tooling names."
  echo "  Offending references:"
  echo "$hits" | sed 's/^/    /'
  exit 1
fi

echo "✔ No internal planning vocabulary in source — repo-hygiene guard satisfied."
