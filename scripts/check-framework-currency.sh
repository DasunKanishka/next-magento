#!/usr/bin/env bash
#
# Framework-currency gate: no deprecated framework file-convention may
# silently persist.
#
# Next 16 deprecated the `middleware` file convention in favor of `proxy`
# (see https://nextjs.org/docs/messages/middleware-to-proxy). Issue 003
# migrated `src/middleware.ts` -> `src/proxy.ts`. This gate fails the build
# if the deprecated filename reappears, or if the current filename goes
# missing (e.g. an accidental revert of the rename).
set -euo pipefail

# Next resolves the middleware/proxy convention at EITHER `(?:src/)?middleware`
# — i.e. both `src/middleware.ts` and a root-level `middleware.ts`. Check both
# so a root-level reappearance can't slip past a src/-only assertion.
for deprecated in src/middleware.ts middleware.ts; do
  if [ -f "$deprecated" ]; then
    echo "✖ Framework-currency gate violated."
    echo "  $deprecated exists — this is the deprecated Next 16 file"
    echo "  convention (see https://nextjs.org/docs/messages/middleware-to-proxy)."
    echo "  Migrate its contents into src/proxy.ts and delete this file."
    exit 1
  fi
done

if [ ! -f src/proxy.ts ]; then
  echo "✖ Framework-currency gate violated."
  echo "  src/proxy.ts is missing — the locale proxy (Next 16 convention)"
  echo "  must exist at this path."
  exit 1
fi

echo "✔ Framework-currency gate satisfied — src/proxy.ts present, src/middleware.ts absent."
