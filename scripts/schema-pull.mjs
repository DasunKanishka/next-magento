#!/usr/bin/env node
/**
 * Refresh the committed `schema.graphql` snapshot from the dev Magento endpoint.
 *
 * Reads config from `.env.local` (MAGENTO_GRAPHQL_ENDPOINT, and — for the
 * mkcert-TLS dev backend — NODE_EXTRA_CA_CERTS). Introspection is enabled in
 * dev only; production has it disabled.
 *
 * `NODE_EXTRA_CA_CERTS` must be present in the CHILD process env at its startup
 * (TLS init reads it once), so we load `.env.local` here and pass the merged
 * env down to the spawned `get-graphql-schema` binary.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import process from 'node:process';

try {
  process.loadEnvFile('.env.local');
} catch {
  // .env.local is optional if the vars are already exported in the shell.
}

const endpoint = process.env.MAGENTO_GRAPHQL_ENDPOINT;
if (!endpoint || endpoint.trim() === '') {
  console.error(
    'MAGENTO_GRAPHQL_ENDPOINT is not set. Copy .env.example to .env.local first.',
  );
  process.exit(1);
}

const result = spawnSync('get-graphql-schema', [endpoint], {
  env: process.env,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

if (result.status !== 0) {
  console.error(result.stderr || 'schema:pull failed to introspect the endpoint.');
  process.exit(result.status ?? 1);
}

writeFileSync('schema.graphql', result.stdout);
console.log(`✔ Wrote schema.graphql from ${endpoint}`);
