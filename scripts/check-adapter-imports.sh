#!/usr/bin/env bash
#
# Adapter-import restriction (architectural rule): all backend access must go
# through the DataSource interface.
#
# The concrete Magento adapter may be imported by exactly ONE module — the
# DataSource resolution layer at src/lib/data-source/index.ts. Every other
# module must go through the backend-agnostic DataSource interface. Files inside
# the connector package (src/lib/data-source/magento/**) may import each other.
#
# Fails (exit 1) if any other file imports a `magento/` path or the
# `magento-graphql-adapter` module.
set -euo pipefail

violations=$(
  grep -rEn "from ['\"][^'\"]*(magento/|magento-graphql-adapter)" src \
    --include='*.ts' --include='*.tsx' \
    | grep -vE '^src/lib/data-source/index\.ts:' \
    | grep -vE '^src/lib/data-source/magento/' \
    || true
)

if [ -n "$violations" ]; then
  echo "✖ Adapter-import restriction violated."
  echo "  Only src/lib/data-source/index.ts may import the Magento adapter."
  echo "  Offending imports:"
  echo "$violations" | sed 's/^/    /'
  exit 1
fi

echo "✔ Adapter-import restriction satisfied — adapter reached only via the resolution module."
