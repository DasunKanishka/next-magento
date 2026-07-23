import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Behavioural tests for scripts/check-no-hardcoded-content.sh. Each fixture is
 * written to a throwaway temp dir OUTSIDE the repo (so the real CI run never
 * scans an intentional violation) and the guard is pointed at that dir via its
 * optional BASE-dir argument. A must-fail fixture per scanned surface proves
 * the guard has teeth; the must-pass fixtures prove it does not false-positive
 * on legitimate non-content strings, third-party payment names, the project
 * name, or mere placeholders (Iron-Law-7's separate concern).
 */
const GUARD = join(process.cwd(), 'scripts/check-no-hardcoded-content.sh');

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'no-hardcoded-content-'));
  mkdirSync(join(dir, 'src/components/header'), { recursive: true });
  mkdirSync(join(dir, 'src/components/footer'), { recursive: true });
  mkdirSync(join(dir, 'src/components/home'), { recursive: true });
  mkdirSync(join(dir, 'src/app'), { recursive: true });
  mkdirSync(join(dir, 'src/config'), { recursive: true });
  mkdirSync(join(dir, 'src/other'), { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Runs the guard against the temp BASE dir; returns { code, output }. */
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

function write(relPath: string, body: string) {
  writeFileSync(join(dir, relPath), body);
}

describe('check-no-hardcoded-content guard', () => {
  it('PASSES on a clean tree (no denylist literal, no brand token anywhere)', () => {
    write(
      'src/components/footer/Footer.tsx',
      'export function Footer({ identity }: { identity: { tagline: string } }) {\n  return identity.tagline;\n}\n',
    );
    write('src/config/delivery.ts', 'export const FREE_SHIPPING_THRESHOLD_EUR = 150;\n');
    write(
      'src/other/note.ts',
      '// next-bns is the project identifier, not store content\n',
    );
    const { code, output } = runGuard();
    expect(code, output).toBe(0);
  });

  const mustFailSurface: Array<{ name: string; file: string; body: string }> = [
    {
      name: 'store name reintroduced in the footer',
      file: 'src/components/footer/Footer.tsx',
      body: "export const NAME = 'TopDrinks';\n",
    },
    {
      name: 'legal entity reintroduced in src/config',
      file: 'src/config/store-identity.ts',
      body: "export const LEGAL_ENTITY = 'TopDrinks B.V.';\n",
    },
    {
      name: 'tagline reintroduced in the header',
      file: 'src/components/header/HeaderShell.tsx',
      body: "export const TAGLINE = 'Jouw online drankspeciaalzaak — 8.000+ premium dranken, morgen in huis.';\n",
    },
    {
      name: 'registration number reintroduced in the footer',
      file: 'src/components/footer/Footer.tsx',
      body: "export const KVK = 'KvK 87654321';\n",
    },
    {
      name: 'delivery copy reintroduced in the header',
      file: 'src/components/header/DeliveryCountdown.tsx',
      body: "export const COPY = 'Voor 22:00 besteld, morgen in huis';\n",
    },
    {
      name: 'payment methods reintroduced as a hardcoded array in the footer',
      file: 'src/components/footer/Footer.tsx',
      body: "const PAYMENT_METHODS = ['iDEAL', 'Visa', 'Mastercard', 'PayPal'];\n",
    },
    {
      name: 'footer column heading literal reintroduced in the footer',
      file: 'src/components/footer/Footer.tsx',
      body: "const COLUMNS = [{ heading: 'Assortiment', links: [] }];\n",
    },
    {
      name: 'the SeoContent stat-callout proof-point figures reintroduced in a home component',
      file: 'src/components/home/SeoContent.tsx',
      body: "const STAT_CALLOUTS = [{ value: '8.000+', label: 'x' }, { value: '4,8 ★', label: 'y' }, { value: 'Morgen in huis', label: 'z' }];\n",
    },
    {
      name: 'the SeoContent stat-callout proof-point figures reintroduced directly in the home route (src/app)',
      file: 'src/app/home-page-fixture.tsx',
      body: "export const STAT = '8.000+';\n",
    },
  ];

  for (const c of mustFailSurface) {
    it(`FAILS on: ${c.name}`, () => {
      write(c.file, c.body);
      const { code, output } = runGuard();
      expect(code, output).toBe(1);
      expect(output).toContain(c.file);
    });
  }

  it('FAILS when a brand token leaks into a file OUTSIDE the enumerated surfaces (brand-token scan)', () => {
    write('src/other/seo-meta.ts', "export const SITE = 'TopDrinks';\n");
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('src/other/seo-meta.ts');
    expect(output).toContain('brand token');
  });

  it('FAILS when a brand token leaks into docs/ or README.md', () => {
    mkdirSync(join(dir, 'docs'), { recursive: true });
    write('docs/setup.md', 'Deploying TopDrinks to a new environment.\n');
    const { code, output } = runGuard();
    expect(code, output).toBe(1);
    expect(output).toContain('docs/setup.md');
  });

  const mustPass: Array<{ name: string; file: string; body: string }> = [
    {
      name: 'a CSS class name, aria role, and a --local-* token bridge (non-content)',
      file: 'src/components/header/Nav.tsx',
      body: 'export function Nav() {\n  return (\n    <div role="navigation" className={styles.assortment} style={{ \'--local-x\': \'var(--color-brand)\' }} aria-label="Contact" />\n  );\n}\n',
    },
    {
      name: 'third-party payment-network names used as generic prose (not the hardcoded-array shape)',
      file: 'src/components/footer/PaymentNote.tsx',
      body: '// This project supports iDEAL, Visa, Mastercard and PayPal via the gateway.\nexport const NOTE = true;\n',
    },
    {
      name: 'the project/repo name next-bns (not store content)',
      file: 'src/other/pkg-ref.ts',
      body: "export const REPO = 'next-bns';\n",
    },
    {
      name: 'a data-sourced identity field (no literal denylist value)',
      file: 'src/components/footer/Footer.tsx',
      body: 'export function Footer({ identity }: { identity: { name: string; tagline: string } }) {\n  return `${identity.name}: ${identity.tagline}`;\n}\n',
    },
  ];

  for (const c of mustPass) {
    it(`PASSES on: ${c.name}`, () => {
      write(c.file, c.body);
      const { code, output } = runGuard();
      expect(code, output).toBe(0);
    });
  }

  // "No hardcoded content" ≠ "no placeholder" (Iron Law #7 is a SEPARATE
  // scan). A bare placeholder token carries no concrete real-world content, so
  // this guard — which only recognizes the curated denylist of exact
  // pre-migration literals plus the 4 brand tokens — does not and should not
  // flag it. Passing this guard is not evidence a file is free of
  // placeholders; that is Iron-Law-7's job, not this one's.
  it('DISTINCT FROM IRON LAW 7: a placeholder token (not concrete content) does not trip this guard', () => {
    write('src/config/todo.ts', "export const NOTE = 'TBD: fill in later';\n");
    const { code, output } = runGuard();
    expect(code, output).toBe(0);
  });
});
