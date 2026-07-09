import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * `@graphql-codegen` client-preset config.
 *
 * Types are generated from the COMMITTED `schema.graphql` snapshot — never a
 * live introspection at build time (production introspection is disabled).
 * `pnpm schema:pull` refreshes the snapshot from the dev endpoint; CI
 * regenerates against the snapshot and fails on drift.
 *
 * `fragmentMasking: false` keeps fragment fields directly readable on the query
 * result, so the mapping functions consume plain nested objects.
 *
 * The output dir is overridable via `CODEGEN_OUT` so the git-free drift check
 * (`scripts/codegen-check.mjs`) can regenerate into a temp dir and diff.
 */
const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  ignoreNoDocuments: true,
  generates: {
    [process.env.CODEGEN_OUT ?? './src/gql/']: {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
