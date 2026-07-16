import { describe, it } from 'vitest';

import { expectAllModuleCssReferencesRealTokens } from './tokenAssertions';

describe('module CSS token integrity (repo-wide)', () => {
  it('every var(--*) in every *.module.css resolves to a --local-* bridge or a real contract key', () => {
    expectAllModuleCssReferencesRealTokens('src');
  });
});
