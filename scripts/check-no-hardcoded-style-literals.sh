#!/usr/bin/env bash
#
# Anti-regression guard: no hardcoded style literals.
#
# The whole styling convention (see src/components/STYLING.md) exists so a child
# brand can re-theme every design value through the token contract. A raw style
# literal — a px/rem/em length, a hex/rgb/hsl color, a numeric font weight, a
# bare-numeric CSS value, or an inline style property that is not a `--local-*`
# bridge — silently breaks that: it is invisible to a brand and can never be
# overridden. This guard fails the build if any such literal reappears, so the
# migration that removed them stays permanent.
#
# It scans src/components/** and src/app/** across these surfaces:
#   1. ANY `*.css` file — co-located `*.module.css` AND plain global stylesheets
#      (e.g. app/globals.css, a live brand surface) — via the full CSS ruleset.
#   2. Exported CSS template-literal constants in `.tsx` (a const whose name
#      contains `CSS`, e.g. AgeGate's AGE_GATE_CSS — the sole non-module
#      stylesheet, which a `*.module.css` glob would miss).
#   3. Inline `style={{ ... }}` object literals (structural check).
#   4. `--local-*` bridge VALUES — in `style={{}}` and in resolvable
#      `const … = { … }` bridge objects, so single-brace `style={bridgeConst}`
#      call sites are covered — must be a token or a runtime expression, never a
#      static literal (see check_local_values).
#   5. A broad literal sweep of the whole (comment-stripped) `.tsx`/`.ts` body so
#      a raw hex/length parked in a value-map / const is caught too.
#
# Literal categories flagged: px/rem/em/pt/ch/ex/vmin/vmax/cm/mm/pc/in/Q lengths;
# hex + rgb/rgba/hsl/hsla + oklch/oklab/lab/lch/hwb/color/color-mix colors;
# bare-numeric CSS values; numeric font-weight; `font` shorthand; non-var
# font-family. (Named colors like `red` are NOT flagged — a documented boundary.)
#
# The inline-style check is STRUCTURAL: per the STYLING.md hard rule an inline
# `style` may set ONLY `--local-*` custom properties, so it flags ANY inline
# property that is neither a `--local-*` bridge nor a pure layout/paint MECHANIC
# (see the allowlist below) — even a keyword/percentage value such as
# `height: '100%'`, which a value-shape regex alone would miss.
#
# ── CLOSED ALLOWLIST (every entry is deliberate; to add one, append it here
#    WITH a justification comment, never loosen a pattern to sneak a value
#    through) ────────────────────────────────────────────────────────────────
#   • `0` — unitless zero is dimensionless; no brand re-themes a zero.
#   • `border-radius: 50%` IN A STYLESHEET — a full-circle is a shape mechanic,
#     not a themeable radius (checked implicitly: `50%` carries no length/hex and
#     is not a bare integer, so no CSS rule matches it). NOTE: inline, `50%` on a
#     design property such as `borderRadius` is still REJECTED by the structural
#     check (an inline style may set only `--local-*`); that rejection is
#     intended. Route a runtime radius through a `--local-*` bridge instead.
#   • `clamp(var(--a), <vw|vh>, var(--b))` — a fluid clamp whose min/max
#     endpoints are tokens; the viewport-unit middle term is the CSS fluid
#     mechanic (STYLING.md), so `vw`/`vh` middles are not flagged.
#   • inline `--local-*` bridge assignments — the ONLY thing an inline style may
#     set; their values are expected to be `var(--token)` (verified by the
#     per-component tokenAssertions bridge tests).
#   • MECHANIC inline properties (%MECHANIC below): layout keywords (display,
#     flex*, align*, justify*, position, overflow, …), transition timing,
#     opacity, z-index, transform — a child brand never re-themes these; they
#     are stacking/layout/paint mechanics, not design values.
#   • `@media (… : Npx)` conditions — CSS forbids `var()` in a media condition,
#     so a breakpoint is a responsive mechanic, not a themeable value.
#   • the accessibility visually-hidden clip — `width|height|margin|inset|
#     top|left|right|bottom: 1px | -1px` (the sr-only `1px` clip idiom); its
#     `1px` is the a11y hack, not a design dimension.
#
# If this guard flags a legitimate NEW mechanic, add the property to %MECHANIC
# (inline) or extend an allowlist rule here WITH a comment — do not weaken a
# pattern. If it flags a real design value, tokenize it (add/reference a
# contract token) — that is the guard doing its job.
set -euo pipefail

ROOTS=("$@")
if [ ${#ROOTS[@]} -eq 0 ]; then
  ROOTS=(src/components src/app)
fi

# Collect candidate files (hand-written source only). Generated GraphQL
# documents, type decls, test files (which legitimately assert on px strings),
# and the shared test-utils are out of scope.
mapfile -t FILES < <(
  find "${ROOTS[@]}" -type f \
    \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.next/*' \
    -not -path '*/gql/*' \
    -not -path '*/test-utils/*' \
    -not -name '*.d.ts' \
    -not -name '*.test.ts' -not -name '*.test.tsx' \
    -not -name '*.spec.ts' -not -name '*.spec.tsx' \
    2>/dev/null | sort
)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "✖ No source files found under: ${ROOTS[*]}"
  exit 1
fi

violations=$(perl - "${FILES[@]}" <<'PERL'
use strict;
use warnings;

my @violations;

# Inline-style MECHANIC allowlist (camelCase, as written in a JS style object):
# layout / stacking / paint mechanics a child brand never re-themes. Anything
# NOT here and NOT a `--local-*` bridge is a design value and must not be inline.
my %MECHANIC = map { $_ => 1 } qw(
  display flex flexDirection flexWrap flexFlow flexGrow flexShrink flexBasis
  alignItems alignContent alignSelf justifyContent justifyItems justifySelf
  placeItems placeContent placeSelf order
  gridAutoFlow gridAutoColumns gridAutoRows gridColumn gridRow gridArea
  gridTemplateColumns gridTemplateRows gridTemplateAreas
  position overflow overflowX overflowY overflowWrap
  cursor pointerEvents userSelect touchAction
  textAlign textTransform whiteSpace wordBreak direction writingMode
  transform transformOrigin
  transition transitionProperty transitionDuration transitionTimingFunction
  transitionDelay animation animationName
  opacity zIndex visibility isolation willChange contain
  objectFit objectPosition boxSizing float clear verticalAlign resize
  tableLayout listStyle listStylePosition listStyleType
);

# Length units (any of these after a number is a raw dimension → must be a
# token). vw/vh are deliberately absent: they are the sanctioned clamp() fluid
# middle-term mechanic (STYLING.md), not a themeable value.
my $LEN = qr/(px|rem|em|pt|ch|ex|vmin|vmax|cm|mm|pc|in|Q)/;

# Color-function literals. Covers the modern CSS color spaces in addition to the
# legacy sRGB set. Named colors (red/white/…) are intentionally NOT matched:
# they collide with too many CSS keywords (currentColor/transparent/inherit) and
# JS identifiers to flag without false positives — a documented boundary.
my $COLORFN = qr/(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix|color)/;

# Design-dimension CSS properties that must carry a token, never a bare number.
my $DIM = qr/(?:max-width|min-width|max-height|min-height|width|height|
  row-gap|column-gap|gap|
  padding-top|padding-right|padding-bottom|padding-left|padding-inline|padding-block|padding|
  margin-top|margin-right|margin-bottom|margin-left|margin-inline|margin-block|margin|
  border-radius|border-width|font-size|letter-spacing|flex-basis|
  inset|top|right|bottom|left)/x;

# Strip an a11y visually-hidden `1px` clip from a line before the length check.
sub strip_a11y_clip {
  my ($l) = @_;
  $l =~ s/(?:width|height|margin|inset|top|left|right|bottom)\s*:\s*-?1px//g;
  return $l;
}

# CSS-surface checks (a `*.module.css` file OR a CSS template-literal constant).
sub check_css_block {
  my ($file, $text, $ctx) = @_;
  my @lines = split /\n/, $text, -1;
  for my $i (0 .. $#lines) {
    my $ln = $lines[$i];
    my $no = $i + 1;
    next if $ln =~ /\@media/;              # media conditions: mechanic
    my $l = strip_a11y_clip($ln);
    if ($l =~ /(-?\d*\.?\d+)$LEN\b/) {
      push @violations, "$file [$ctx:$no] raw length literal '$1$2' — use var(--token):\n      $ln";
    }
    if ($l =~ /#[0-9A-Fa-f]{3,8}\b/) {
      push @violations, "$file [$ctx:$no] hex color literal — use var(--color-*):\n      $ln";
    }
    if ($l =~ /\b$COLORFN\s*\(/) {
      push @violations, "$file [$ctx:$no] color-function literal — use var(--color-*):\n      $ln";
    }
    if ($l =~ /(?<![\w-])($DIM)\s*:\s*(-?\d+(?:\.\d+)?)\b(?!\s*(?:px|rem|em|pt|ch|ex|vmin|vmax|cm|mm|pc|in|Q|%|var|vh|vw|fr|s|ms|deg))/) {
      my ($p, $n) = ($1, $2);
      push @violations, "$file [$ctx:$no] bare-numeric value '$p: $n' (no unit/token) — use var(--token):\n      $ln"
        unless $n == 0;
    }
    if ($l =~ /font-weight\s*:\s*\d/) {
      push @violations, "$file [$ctx:$no] numeric font-weight literal — use var(--type-weight-*):\n      $ln";
    }
    if ($l =~ /(?<![\w-])font\s*:\s*[^;]*\d/) {
      push @violations, "$file [$ctx:$no] font shorthand literal — decompose into token properties:\n      $ln";
    }
    if ($l =~ /font-family\s*:\s*(?!\s*var\()[^;]+;/) {
      push @violations, "$file [$ctx:$no] font-family literal — use var(--font-*):\n      $ln";
    }
  }
}

# Broad literal sweep of a comment-stripped .tsx/.ts body (value-map laundering).
sub check_broad {
  my ($file, $text) = @_;
  my @lines = split /\n/, $text, -1;
  for my $i (0 .. $#lines) {
    my $ln = $lines[$i];
    my $no = $i + 1;
    next if $ln =~ /\@media/;
    my $l = strip_a11y_clip($ln);
    if ($l =~ /(-?\d*\.?\d+)$LEN\b/) {
      push @violations, "$file:$no raw length literal '$1$2' — use var(--token):\n      $ln";
    }
    if ($l =~ /#[0-9A-Fa-f]{3,8}\b/) {
      push @violations, "$file:$no hex color literal — use var(--color-*):\n      $ln";
    }
    if ($l =~ /\b$COLORFN\s*\(/) {
      push @violations, "$file:$no color-function literal — use var(--color-*):\n      $ln";
    }
  }
}

# Bridge-value check: a `--local-*` custom property (in an inline `style={{}}`
# OR in a resolvable `const … = { … }` bridge object, so single-brace
# `style={bridgeConst}` call sites are covered too) must resolve to a
# var(--token) or a genuine RUNTIME expression (a `${…}` template, a ternary
# whose branches are tokens, a variable/member/call — the values that legitimately
# vary at runtime). A STATIC raw literal parked in a bridge — a bare number
# (e.g. a laundered font-weight `700`) or a static hex/length string — is flagged.
#
# KNOWN BOUNDARY (documented, see the guard's fixture `known-boundary`): a value
# routed through a SEPARATE value-map const, e.g.
#   const w = { bold: 700 }; … '--local-weight': w.bold
# is not resolved here — `w.bold` reads as a runtime member expression. Closing it
# would require whole-module data-flow analysis or a bare-integer heuristic that
# false-positives on z-index/order/count literals, so it is left to the
# per-component bridge tokenAssertions tests + code review rather than guessed at.
sub check_local_values {
  my ($file, $src) = @_;
  while ($src =~ /['"](--local-[\w-]+)['"]\s*:\s*([^,}]+)/gs) {
    my ($key, $val) = ($1, $2);
    my $line = (substr($src, 0, pos($src)) =~ tr/\n//) + 1;
    $val =~ s/\s+$//;
    next if $val =~ /var\s*\(/;            # token reference (possibly ternary)
    next if $val =~ /\$\{/;                # runtime template interpolation
    # Strip quoted-string contents; if a JS expression (identifier / member /
    # ternary / call) remains, the value is computed at runtime → allowed.
    (my $bare = $val) =~ s/'[^']*'//g;
    $bare =~ s/"[^"]*"//g;
    next if $bare =~ /[A-Za-z_\$.?()]/;
    # What remains is a pure static literal: a bare number, or a single quoted
    # string that is a keyword/percentage (allowed) or a design literal (flag).
    if ($val =~ /^-?\d+(?:\.\d+)?$/) {
      push @violations,
        "$file:$line bridge '$key' = static numeric literal '$val' — a --local-* value must be var(--token) or a runtime expression:\n      $key: $val"
        unless $val == 0;
      next;
    }
    if ($val =~ /#[0-9A-Fa-f]{3,8}\b/ || $val =~ /\d\s*$LEN\b/) {
      push @violations,
        "$file:$line bridge '$key' = static design literal $val — use var(--token):\n      $key: $val";
    }
  }
}

# Structural inline-style check: every `style={{ ... }}` property key must be a
# `--local-*` bridge or a MECHANIC; anything else is a design value inline.
sub check_inline {
  my ($file, $src) = @_;
  while ($src =~ /(?<![\w])style=\{\s*\{([^{}]*)\}/gs) {
    my $body = $1;
    my $line = (substr($src, 0, pos($src)) =~ tr/\n//) + 1;
    while ($body =~ /(?:^|[{,])\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z][\w]*))\s*:/g) {
      my $key = defined $1 ? $1 : defined $2 ? $2 : $3;
      next if $key =~ /^--local-/;
      next if $MECHANIC{$key};
      push @violations,
        "$file:$line inline style sets '$key' — an inline style may set only --local-* bridge properties (mechanics excepted):\n      style={{$body}}";
    }
  }
}

for my $file (@ARGV) {
  open my $fh, '<', $file or do { push @violations, "cannot read $file"; next; };
  local $/;
  my $raw = <$fh>;
  close $fh;

  # Strip comments while preserving line count (block comments keep newlines).
  my $src = $raw;
  $src =~ s{/\*.*?\*/}{ (my $m = $&) =~ tr/\n//cd; $m }ges;

  # Any .css file — module OR a plain global stylesheet (e.g. app/globals.css, a
  # live brand surface) — runs the full CSS ruleset.
  if ($file =~ /\.css$/) {
    check_css_block($file, $src, "css");
    next;
  }

  # .tsx / .ts — strip JS line comments (protect `://` in URLs).
  $src =~ s{(^|[^:])//[^\n]*}{$1}g;

  check_inline($file, $src);
  check_local_values($file, $src);

  # CSS template-literal constants (name contains CSS), e.g. AGE_GATE_CSS.
  while ($src =~ /\bconst\s+(\w*CSS\w*)\s*=\s*`(.*?)`/gs) {
    check_css_block($file, $2, "css-const $1");
  }

  # Broad sweep with template literals removed (CSS consts are scanned above;
  # laundering hides in object/const value-maps, not template strings).
  my $broad = $src;
  $broad =~ s/`[^`]*`//gs;
  check_broad($file, $broad);
}

print join("\n", @violations);
PERL
)

if [ -n "$violations" ]; then
  echo "✖ Hardcoded style literal(s) found — child brands cannot override these."
  echo "  Tokenize the value (reference a contract token / route it through a"
  echo "  --local-* bridge), or, for a genuine mechanic, extend the allowlist in"
  echo "  scripts/check-no-hardcoded-style-literals.sh with a justification."
  echo "  Offending literals:"
  echo "$violations" | sed 's/^/    /'
  exit 1
fi

echo "✔ No hardcoded style literals — tokenization guard satisfied."
