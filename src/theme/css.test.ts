import { describe, expect, it } from 'vitest';

import { CONTRACT_TOKEN_NAMES } from './contract';
import { defaultTokens } from './brands/default';
import { buildBrandStyleBlock } from './css';

describe('buildBrandStyleBlock', () => {
  it('scopes the declaration block under the brand attribute selector', () => {
    const block = buildBrandStyleBlock('default', defaultTokens);
    expect(block.startsWith('[data-brand="default"] {')).toBe(true);
    expect(block.trim().endsWith('}')).toBe(true);
  });

  it('emits every contract key as a `name: value;` declaration', () => {
    const block = buildBrandStyleBlock('default', defaultTokens);

    for (const key of CONTRACT_TOKEN_NAMES) {
      expect(block).toContain(`${key}: ${defaultTokens[key]};`);
    }
  });
});
