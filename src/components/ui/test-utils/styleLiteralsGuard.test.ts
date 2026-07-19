import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Behavioural tests for scripts/check-no-hardcoded-style-literals.sh. Each
 * fixture is written to a throwaway temp dir OUTSIDE the repo (so the real CI
 * run never scans an intentional violation) and the guard is pointed at that
 * dir. A must-fail fixture per literal category proves the guard has teeth; the
 * must-pass fixtures prove it does not false-positive on the sanctioned
 * mechanics and the token/bridge forms.
 */
const GUARD = join(process.cwd(), 'scripts/check-no-hardcoded-style-literals.sh');

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'style-literals-'));
  mkdirSync(join(dir, 'app'), { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Runs the guard against the temp dir; returns { code, output }. */
function runGuard(): { code: number; output: string } {
  try {
    const output = execFileSync('bash', [GUARD, dir], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, output };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('check-no-hardcoded-style-literals guard', () => {
  const mustFail: Array<{ name: string; file: string; body: string }> = [
    {
      name: 'raw px length in a module',
      file: 'a.module.css',
      body: '.x {\n  padding: 14px;\n}\n',
    },
    {
      name: 'bare-numeric CSS value (gap: 8) in a module',
      file: 'b.module.css',
      body: '.x {\n  gap: 8;\n}\n',
    },
    {
      name: 'hex color in a module',
      file: 'c.module.css',
      body: '.x {\n  color: #fff;\n}\n',
    },
    {
      name: 'rgba color in a module',
      file: 'd.module.css',
      body: '.x {\n  background: rgba(0, 0, 0, 0.5);\n}\n',
    },
    {
      name: 'font shorthand literal in a module',
      file: 'e.module.css',
      body: '.x {\n  font: 700 22px/1.1;\n}\n',
    },
    {
      name: 'numeric font-weight in a module',
      file: 'f.module.css',
      body: '.x {\n  font-weight: 800;\n}\n',
    },
    {
      name: "inline height: '100%' style prop (structural)",
      file: 'g.tsx',
      body: "export const C = () => <div style={{ height: '100%' }} />;\n",
    },
    {
      name: 'laundered hex parked in a const value-map',
      file: 'h.tsx',
      body: "const map = { bg: '#abcdef' };\nexport const C = () => <div style={{ '--local-bg': map.bg }} />;\n",
    },
    {
      name: 'literal inside an exported CSS template-literal constant',
      file: 'i.tsx',
      body: 'export const SAMPLE_CSS = `\n.x { color: #123456; padding: 10px; }\n`;\n',
    },
    {
      name: 'literal in a plain (non-module) .css file',
      file: 'globals.css',
      body: '.x {\n  padding: 23px;\n  color: #abc123;\n  font-weight: 700;\n}\n',
    },
    {
      name: 'modern color function (oklch / color-mix)',
      file: 'j.module.css',
      body: '.x {\n  color: oklch(0.6 0.1 200);\n}\n',
    },
    {
      name: 'extended length unit (pt)',
      file: 'k.module.css',
      body: '.x {\n  padding: 12pt;\n}\n',
    },
    {
      name: 'extended length unit (vmin)',
      file: 'l.module.css',
      body: '.x {\n  width: 5vmin;\n}\n',
    },
    {
      name: 'laundered bare-numeric weight in a single-brace bridge const',
      file: 'm.tsx',
      body: "const bridge = { '--local-weight': 700 } as React.CSSProperties;\nexport const C = () => <div style={bridge} />;\n",
    },
    {
      name: 'raw literal in a single-brace bridge const (style={const})',
      file: 'n.tsx',
      body: "const bridge = { '--local-height': '44px' } as React.CSSProperties;\nexport const C = () => <div style={bridge} />;\n",
    },
  ];

  for (const c of mustFail) {
    it(`FAILS on: ${c.name}`, () => {
      writeFileSync(join(dir, c.file), c.body);
      const { code, output } = runGuard();
      expect(code, output).toBe(1);
      expect(output).toContain(c.file);
    });
  }

  const mustPass: Array<{ name: string; file: string; body: string }> = [
    {
      name: 'token reference in a module',
      file: 'a.module.css',
      body: '.x {\n  padding: var(--space-4);\n  gap: var(--space-2);\n}\n',
    },
    {
      name: 'unitless zero, opacity, z-index and unitless line-height',
      file: 'b.module.css',
      body: '.x {\n  margin: 0;\n  opacity: 1;\n  z-index: 1000;\n  line-height: 1.4;\n}\n',
    },
    {
      name: 'full-circle radius and clamp with token endpoints + vw middle',
      file: 'c.module.css',
      body: '.x {\n  border-radius: 50%;\n  padding: clamp(var(--space-5), 4vw, var(--space-section));\n}\n',
    },
    {
      name: 'media condition and the a11y visually-hidden 1px clip',
      file: 'd.module.css',
      body: '@media (min-width: 768px) {\n  .x {\n    width: 1px;\n    height: 1px;\n    margin: -1px;\n  }\n}\n',
    },
    {
      name: 'inline --local-* bridge assignment',
      file: 'e.tsx',
      body: "export const C = () => <div style={{ '--local-bg': 'var(--color-cta)' }} />;\n",
    },
    {
      name: 'inline mechanic properties (display/flex/transition/opacity)',
      file: 'f.tsx',
      body: "export const C = () => <div style={{ display: 'block', flex: '0 0 auto', transition: 'transform .15s ease', opacity: 1 }} />;\n",
    },
    {
      name: 'legit runtime bridge values (${x}% / ${x}px template + var ternary)',
      file: 'g.tsx',
      body: "export const C = ({ pct, w, on }: { pct: number; w: number; on: boolean }) => {\n  const bridge = {\n    '--local-fill': `${pct}%`,\n    '--local-min-w': `${w}px`,\n    '--local-fg': on ? 'var(--color-cta)' : 'var(--color-text-muted)',\n    '--local-width': on ? '100%' : 'auto',\n  } as React.CSSProperties;\n  return <div style={bridge} />;\n};\n",
    },
  ];

  for (const c of mustPass) {
    it(`PASSES on: ${c.name}`, () => {
      writeFileSync(join(dir, c.file), c.body);
      const { code, output } = runGuard();
      expect(code, output).toBe(0);
    });
  }

  // Documented KNOWN BOUNDARY: a literal routed through a SEPARATE value-map
  // const (`w.bold` reads as a runtime member expression) is NOT caught by the
  // guard — closing it needs whole-module data-flow analysis or a bare-integer
  // heuristic that false-positives on z-index/order/count. This is left to the
  // per-component bridge tokenAssertions tests + code review. The test pins the
  // current behaviour so the limit is explicit, not silent; if a future guard
  // closes it, flip this expectation.
  it('KNOWN LIMIT: does not catch a literal laundered via a separate value-map const', () => {
    writeFileSync(
      join(dir, 'boundary.tsx'),
      "const W = { bold: 700 };\nexport const C = () => <div style={{ '--local-weight': W.bold } as React.CSSProperties} />;\n",
    );
    const { code } = runGuard();
    expect(code).toBe(0); // documents the boundary; NOT an endorsement
  });
});
