import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DELIVERY_DEADLINE_COPY } from '@/config/delivery';

/**
 * The delivery promise must read identically wherever it appears, and the
 * previous, retired promise must not survive anywhere in the rendered home
 * surfaces. This guards against a stale copy of the old promise creeping back
 * into any header/footer/home source file.
 */
const RETIRED_PROMISE = ['Voor 16:00 besteld', 'vandaag verzonden'].join(', ');

const SCANNED_DIRS = [
  'src/components/home',
  'src/components/header',
  'src/components/footer',
  'src/app/[locale]',
];

function sourceFiles(dir: string): string[] {
  const abs = resolve(process.cwd(), dir);
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(join(dir, entry)));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('delivery trust copy', () => {
  it('uses the single unified promise string', () => {
    expect(DELIVERY_DEADLINE_COPY).toBe('Voor 22:00 besteld, morgen in huis');
  });

  it('has zero occurrences of the retired promise in any home surface', () => {
    const offenders = SCANNED_DIRS.flatMap(sourceFiles).filter((file) =>
      readFileSync(file, 'utf8').includes(RETIRED_PROMISE),
    );
    expect(offenders, `retired promise found in: ${offenders.join(', ')}`).toEqual([]);
  });
});
