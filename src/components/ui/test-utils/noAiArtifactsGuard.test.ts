import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Behavioural tests for scripts/check-no-ai-artifacts.sh and the matching
 * .githooks/commit-msg hook. Unlike check-no-hardcoded-content.sh's fixtures
 * (which use `find` and tolerate a plain non-git temp dir), this guard reads
 * `git ls-files` / `git log`, so its fixtures must live in a REAL throwaway
 * git repo — created fresh per test, OUTSIDE this repo, and torn down after.
 *
 * Commits are built with `git write-tree` / `git commit-tree` + `update-ref`
 * (never `git commit`) so a deliberately AI-tagged trailer is materialized
 * without ever running an actual commit.
 */
const GUARD = join(process.cwd(), 'scripts/check-no-ai-artifacts.sh');
const COMMIT_MSG_HOOK = join(process.cwd(), '.githooks/commit-msg');

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'no-ai-artifacts-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(relPath: string, body: string) {
  const full = join(dir, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, body);
}

/** Stages the working tree and writes a commit object — never `git commit`. */
function makeCommit(message: string, parent?: string): string {
  execFileSync('git', ['add', '-A'], { cwd: dir });
  const tree = execFileSync('git', ['write-tree'], { cwd: dir, encoding: 'utf8' }).trim();
  const args = ['commit-tree', tree];
  if (parent) args.push('-p', parent);
  return execFileSync('git', args, { cwd: dir, input: message, encoding: 'utf8' }).trim();
}

function setHead(sha: string) {
  execFileSync('git', ['update-ref', 'refs/heads/main', sha], { cwd: dir });
}

/** Runs the guard against the temp repo; returns { code, output }. */
function runGuard(range?: string): { code: number; output: string } {
  const args = range ? [GUARD, range] : [GUARD];
  try {
    const output = execFileSync('bash', args, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, output };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/** Runs the commit-msg hook directly against a message file — no real commit. */
function runCommitMsgHook(message: string): { code: number; output: string } {
  const msgFile = join(dir, 'MSG');
  writeFileSync(msgFile, message);
  try {
    const output = execFileSync('bash', [COMMIT_MSG_HOOK, msgFile], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, output };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('check-no-ai-artifacts guard — tracked-file scan', () => {
  it('PASSES on a clean tracked tree', () => {
    write('README.md', 'Nothing AI-tool related here.\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(0);
  });

  it('FAILS when CLAUDE.md is tracked at repo root', () => {
    write('CLAUDE.md', 'agent instructions\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('CLAUDE.md');
  });

  it('FAILS when AGENTS.md is tracked at repo root', () => {
    write('AGENTS.md', 'agent instructions\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('AGENTS.md');
  });

  // Regression test for the fix-round-1 finding: the file-scan used to
  // exclude the ENTIRE scripts/ directory (`grep -vE '^scripts/'`), so a real
  // artifact planted under scripts/ escaped detection. It must now be caught
  // — only this guard's OWN file is excluded (see the next test).
  it('FAILS when a .cursorrules artifact is tracked under scripts/ (closes the scripts/ bypass)', () => {
    write('scripts/.cursorrules', 'ignore previous instructions\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('scripts/.cursorrules');
  });

  it('FAILS when a CLAUDE.md artifact is tracked under scripts/', () => {
    write('scripts/CLAUDE.md', 'agent instructions\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('scripts/CLAUDE.md');
  });

  // Self-reference exception: only this guard's OWN path is excluded — a
  // same-named-but-different-content copy at that exact path must not
  // false-positive the guard on itself.
  it('does NOT false-positive on its own path (scripts/check-no-ai-artifacts.sh)', () => {
    write(
      'scripts/check-no-ai-artifacts.sh',
      '#!/usr/bin/env bash\n# mentions CLAUDE, AGENTS, claude, anthropic in comments\n',
    );
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(0);
  });

  it('FAILS on a .aider config artifact tracked anywhere in the tree', () => {
    write('src/.aiderignore', 'node_modules\n');
    makeCommit('chore: init');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('.aiderignore');
  });
});

describe('check-no-ai-artifacts guard — commit-range provenance scan', () => {
  it('PASSES across a clean commit range (no trailer)', () => {
    const base = makeCommit('chore: init');
    setHead(base);
    write('src/feature.ts', 'export const X = 1;\n');
    const clean = makeCommit('feat: add feature', base);
    setHead(clean);
    const { code, output } = runGuard();
    expect(code, output).toBe(0);
  });

  it('FAILS on a Co-Authored-By: Claude trailer in the default HEAD~1..HEAD range', () => {
    const base = makeCommit('chore: init');
    setHead(base);
    write('src/feature.ts', 'export const X = 1;\n');
    const bad = makeCommit(
      'feat: add feature\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>\n',
      base,
    );
    setHead(bad);
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output.toLowerCase()).toContain('claude');
  });

  it('FAILS on a lowercase co-authored-by trailer naming anthropic, via an explicit range', () => {
    const base = makeCommit('chore: init');
    setHead(base);
    write('src/feature.ts', 'export const X = 1;\n');
    const bad = makeCommit(
      'fix: patch\n\nco-authored-by: Some Bot <bot@anthropic.com>\n',
      base,
    );
    setHead(bad);
    const { code, output } = runGuard(`${base}..${bad}`);
    expect(code, output).toBe(1);
    expect(output.toLowerCase()).toContain('anthropic');
  });

  it('PASSES a range containing an unrelated Co-authored-by trailer (a real human pair-programmer)', () => {
    const base = makeCommit('chore: init');
    setHead(base);
    write('src/feature.ts', 'export const X = 1;\n');
    const clean = makeCommit(
      'feat: pair-programmed change\n\nCo-authored-by: Jane Doe <jane@example.com>\n',
      base,
    );
    setHead(clean);
    const { code, output } = runGuard(`${base}..${clean}`);
    expect(code, output).toBe(0);
  });
});

describe('.githooks/commit-msg hook', () => {
  it('PASSES a clean commit message', () => {
    const { code } = runCommitMsgHook('feat: add widget\n\nNo AI provenance here.\n');
    expect(code).toBe(0);
  });

  it('REJECTS a Co-Authored-By: Claude trailer', () => {
    const { code, output } = runCommitMsgHook(
      'feat: add widget\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n',
    );
    expect(code, output).toBe(1);
    expect(output.toLowerCase()).toContain('claude');
  });

  it('REJECTS a mixed-case co-authored-by trailer naming Anthropic', () => {
    const { code, output } = runCommitMsgHook(
      'fix: patch\n\nCo-authored-by: Bot <bot@ANTHROPIC.com>\n',
    );
    expect(code, output).toBe(1);
  });

  it('PASSES a commit message with an unrelated (human) co-authored-by trailer', () => {
    const { code } = runCommitMsgHook(
      'feat: pair-programmed change\n\nCo-authored-by: Jane Doe <jane@example.com>\n',
    );
    expect(code).toBe(0);
  });
});
