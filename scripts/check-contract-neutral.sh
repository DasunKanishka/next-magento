#!/usr/bin/env bash
#
# Neutral-contract guard.
#
# The parent token contract (src/theme/contract.ts) declares CSS custom
# property NAMES only — it must never carry a brand's concrete design
# values (hex colors, the loaded brand font name, gradient/shadow literals).
# Every value lives exclusively in a child brand's TokenSheet
# (src/theme/brands/*.ts). Fail the build if any brand-value literal has
# leaked into the contract file.
set -euo pipefail

CONTRACT_FILE="src/theme/contract.ts"

if [ ! -f "$CONTRACT_FILE" ]; then
  echo "✖ Expected contract file not found at $CONTRACT_FILE"
  exit 1
fi

# Representative brand-value literal patterns: hex colors, the brand font
# name, and the gradient/rgba syntax used by the delivered pattern/shadow
# values. None of these belong in a names-only contract file.
patterns=(
  '#[0-9A-Fa-f]{3,8}'
  'Figtree'
  'rgba\('
  'repeating-linear-gradient'
)

violations=""
for pattern in "${patterns[@]}"; do
  match=$(grep -nE "$pattern" "$CONTRACT_FILE" || true)
  if [ -n "$match" ]; then
    violations="${violations}  pattern /${pattern}/:\n$(echo "$match" | sed 's/^/    /')\n"
  fi
done

if [ -n "$violations" ]; then
  echo "✖ Neutral-contract guard violated: brand-value literal(s) found in $CONTRACT_FILE"
  echo -e "$violations"
  exit 1
fi

echo "✔ Neutral-contract guard satisfied — $CONTRACT_FILE contains zero brand-value literals."
