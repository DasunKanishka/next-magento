#!/usr/bin/env bash
#
# Server-only trust boundary guard.
#
# Backend connector configuration (GraphQL endpoint, store code) is SERVER-ONLY.
# Prefixing any such value with `NEXT_PUBLIC_` would inline it into the client
# bundle, exposing the backend to the browser — exactly the boundary this
# project forbids. Fail the build if any `NEXT_PUBLIC_MAGENTO*` reference exists
# anywhere in the app source or committed env files.
#
# This checker file itself is excluded from the scan (its match is the pattern
# definition, not a real occurrence), along with generated/vendored artifacts.
set -euo pipefail

matches=$(
  grep -rInE "NEXT_PUBLIC_MAGENTO" . \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=.git \
    --exclude-dir=scripts \
    --exclude=pnpm-lock.yaml \
    --exclude=schema.graphql \
    || true
)

if [ -n "$matches" ]; then
  echo "✖ Server-only boundary violated: a NEXT_PUBLIC_MAGENTO* reference was found."
  echo "  Backend config must never be exposed to the client via NEXT_PUBLIC_."
  echo "  Offending references:"
  echo "$matches" | sed 's/^/    /'
  exit 1
fi

echo "✔ No NEXT_PUBLIC_MAGENTO* references — server-only backend config preserved."
