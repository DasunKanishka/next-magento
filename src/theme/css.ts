import type { TokenSheet } from './contract';
import type { BrandId } from './brand';

/**
 * Renders a resolved `TokenSheet` as a CSS custom-property block scoped
 * under a brand attribute selector, e.g. `[data-brand="default"] { ... }`.
 * This is what the root layout injects server-side so every contract
 * variable resolves before first paint — no client-side theme application,
 * no flash of unstyled/wrong-brand content.
 */
export function buildBrandStyleBlock(brandId: BrandId, tokens: TokenSheet): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `[data-brand="${brandId}"] {\n${declarations}\n}`;
}
