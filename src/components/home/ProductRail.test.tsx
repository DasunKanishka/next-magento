import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/ProductRail.module.css');

// ProductRail is an async Server Component whose product content streams from a
// per-request read, so it is not renderable through the React Testing Library
// client harness. Its stylesheet, however, is a plain file — this guard reads
// it directly and fails if it references any token outside the contract.
describe('ProductRail stylesheet', () => {
  it('references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
