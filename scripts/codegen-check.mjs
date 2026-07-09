#!/usr/bin/env node
/**
 * Git-free codegen drift check.
 *
 * Regenerates the client-preset output into a temp dir (via CODEGEN_OUT) and
 * diffs it against the committed `src/gql/`. Exits non-zero on any difference,
 * so it fails the build when the committed types are stale relative to
 * `schema.graphql` + the `graphql()` documents in source.
 *
 * CI additionally runs `pnpm codegen` + `git diff --exit-code` (it has a repo);
 * this script is the equivalent that also runs anywhere a repo is not present.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const COMMITTED = 'src/gql';
const temp = mkdtempSync(join(tmpdir(), 'nbns-codegen-'));

function cleanup() {
  rmSync(temp, { recursive: true, force: true });
}

const gen = spawnSync('graphql-codegen', ['--config', 'codegen.ts'], {
  stdio: 'inherit',
  env: { ...process.env, CODEGEN_OUT: `${temp}/` },
});
if (gen.status !== 0) {
  cleanup();
  process.exit(gen.status ?? 1);
}

const diff = spawnSync('diff', ['-r', COMMITTED, temp], { stdio: 'inherit' });
cleanup();

if (diff.status !== 0) {
  console.error(
    '\n✖ Codegen drift: committed src/gql differs from a fresh generation. ' +
      'Run `pnpm codegen` and commit the result.',
  );
  process.exit(1);
}
console.log('✔ No codegen drift — committed types match schema.graphql.');
