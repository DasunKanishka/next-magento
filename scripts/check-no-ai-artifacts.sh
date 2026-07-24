#!/usr/bin/env bash
#
# AI-artifact + provenance guard: no AI-coding-tool instruction/config file may
# ever be tracked in this repo, and no commit may carry an AI co-author
# trailer into history.
#
# Fails on:
#   (a) any TRACKED file (git ls-files) whose path matches
#       (^|/)(CLAUDE|AGENTS)\.md$|\.cursor|\.aider|copilot
#       — a CLAUDE.md/AGENTS.md instruction file, or a .cursor*/.aider*/
#       copilot config artifact, committed anywhere in the tree.
#   (b) any `Co-authored-by:` trailer matching claude|anthropic
#       (case-insensitive) on a commit in the scanned commit range.
#
# ── SELF-REFERENCE EXCEPTION ────────────────────────────────────────────────
# This script's own path names the strings "CLAUDE"/"AGENTS"/"claude"/
# "anthropic" in its comments/patterns above — scanning itself (or a future
# *.test.* fixture for it) would be a guaranteed false positive. Mirroring
# check-no-hardcoded-content.sh's own pass-3 self-exclusion convention, the
# file-scan below drops ONLY this script's own path (NOT the whole scripts/
# dir — a real artifact planted anywhere else under scripts/, e.g.
# scripts/CLAUDE.md or scripts/.cursorrules, must still be caught) and any
# `*.test.*`/`*.spec.*` fixture path from the candidate set before applying
# the pattern.
#
# ── COMMIT-RANGE SCOPE ──────────────────────────────────────────────────────
# The provenance scan is intentionally bounded to NEW commits, not full repo
# history: this repo's pre-remediation history already contains real Claude
# co-author trailers (the defect this guard exists to stop from recurring —
# see the dedicated history-rewrite issue). Scanning all history here would
# permanently fail CI on old, already-known commits instead of gating new
# ones. Range resolution order:
#   1. an explicit "$1" (a `<base>..<head>` range, or a single ref);
#   2. `origin/$GITHUB_BASE_REF..HEAD` (GitHub Actions pull_request event);
#   3. the previous commit only (`HEAD~1..HEAD`) — the safe local/pre-commit
#      default that needs no network access or remote-tracking refs.
# NOTE: in CI, a `push` event whose `before` SHA is all-zeros (a brand-new
# branch's first push) falls back to a single-commit (`HEAD`) scan — a push
# of >1 commit on a first-ever push gets narrower coverage than the
# pull_request event's full `base..HEAD` range. This is an accepted,
# documented gap: PRs (the normal path into `main`/`develop`) always get the
# full range; a direct multi-commit first push bypassing PR review is already
# an anomaly this guard doesn't need to be the sole defense against.
set -euo pipefail

BASE="${2:-.}"
RANGE="${1:-}"

ARTIFACT_PATTERN='(^|/)(CLAUDE|AGENTS)\.md$|\.cursor|\.aider|copilot'

# ---- 1. Tracked AI-tool artifact filenames --------------------------------
mapfile -t artifact_hits < <(
  git -C "$BASE" ls-files 2>/dev/null \
    | grep -vE '^scripts/check-no-ai-artifacts\.sh$' \
    | grep -vE '\.test\.|\.spec\.' \
    | grep -iE "$ARTIFACT_PATTERN" \
    || true
)

# ---- 2. Co-authored-by AI-provenance trailer scan -------------------------
if [ -z "$RANGE" ]; then
  if [ -n "${GITHUB_BASE_REF:-}" ] && git -C "$BASE" rev-parse --verify "origin/${GITHUB_BASE_REF}" >/dev/null 2>&1; then
    RANGE="origin/${GITHUB_BASE_REF}..HEAD"
  elif git -C "$BASE" rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    RANGE="HEAD~1..HEAD"
  else
    RANGE="HEAD"
  fi
fi

if [[ "$RANGE" == *..* ]]; then
  commit_log=$(git -C "$BASE" log --format='%B' "$RANGE" 2>/dev/null || true)
else
  commit_log=$(git -C "$BASE" log -1 --format='%B' "$RANGE" 2>/dev/null || true)
fi

mapfile -t trailer_hits < <(
  printf '%s\n' "$commit_log" | grep -inE '^Co-authored-by:.*(claude|anthropic)' || true
)

violations=()
for f in "${artifact_hits[@]}"; do
  [ -n "$f" ] && violations+=("tracked AI-tool artifact: $f")
done
for t in "${trailer_hits[@]}"; do
  [ -n "$t" ] && violations+=("AI co-author trailer in commit range ($RANGE): $t")
done

if [ "${#violations[@]}" -gt 0 ]; then
  echo "✖ AI-artifact / provenance guard failed — no AI-tool instruction/config"
  echo "  file may be tracked, and no commit may carry a Claude/Anthropic"
  echo "  co-author trailer into history."
  printf '    %s\n' "${violations[@]}"
  exit 1
fi

echo "✔ No tracked AI-tool artifacts; no AI co-author trailers in range ($RANGE)."
