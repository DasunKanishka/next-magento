import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The delivery promise is backend-sourced content
 * (`getStoreIdentity().deliveryPromise.copy`) — no unified string constant is
 * hardcoded here anymore. This guard still protects against the previous,
 * retired promise creeping back into any header/footer/home source file as a
 * new hardcoded literal.
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
  it('has zero occurrences of the retired promise in any home surface', () => {
    const offenders = SCANNED_DIRS.flatMap(sourceFiles).filter((file) =>
      readFileSync(file, 'utf8').includes(RETIRED_PROMISE),
    );
    expect(offenders, `retired promise found in: ${offenders.join(', ')}`).toEqual([]);
  });
});
