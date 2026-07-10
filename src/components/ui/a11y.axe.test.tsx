import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { buildBrandStyleBlock } from '@/theme/css';
import { defaultTokens } from '@/theme/brands/default';
import { Button } from './core/Button';
import { IconButton } from './core/IconButton';
import { Badge } from './core/Badge';
import { Chip } from './core/Chip';
import { Rating } from './core/Rating';
import { SearchBar } from './forms/SearchBar';
import { TextField } from './forms/TextField';
import { Alert } from './feedback/Alert';
import { Toast } from './feedback/Toast';
import { ProductCard } from './product/ProductCard';
import { PriceBlock } from './product/PriceBlock';
import { DeliveryNote } from './commerce/DeliveryNote';
import { QuantityStepper } from './commerce/QuantityStepper';
import { CountrySelector } from './i18n/CountrySelector';
import { LanguageSelector } from './i18n/LanguageSelector';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Test-only a11y harness — NOT a shipped production route. Mirrors
 * `src/app/layout.tsx`'s brand-token injection (`data-brand="default"` +
 * the resolved `TokenSheet` style block) so every `var(--*)` reference in
 * the components below resolves exactly as it would in the real app,
 * before scanning the rendered DOM with axe-core.
 *
 * Two axe rules are disabled and explicitly flagged as deferred rather than
 * faked as passing: `color-contrast` and `target-size` both require real
 * layout/paint (computed pixel geometry, canvas-based pixel sampling) that
 * jsdom does not implement — jsdom's `getBoundingClientRect` always returns
 * a zero-size rect and there is no rendering surface to sample colors from.
 * Playwright (a real browser) is NOT installed in this environment, so these
 * two rules cannot be exercised here; they are out of scope for this jsdom
 * harness and must be covered by a future browser-based a11y pass.
 */
function Harness() {
  const tokens = defaultTokens;
  const styleBlock = buildBrandStyleBlock('default', tokens);
  return (
    <div data-brand="default">
      <style dangerouslySetInnerHTML={{ __html: styleBlock }} />

      <Button variant="primary">In winkelmandje</Button>
      <Button variant="secondary">Verder winkelen</Button>
      <Button variant="tertiary">Wissen</Button>
      <Button variant="link">Bekijk alle reviews</Button>
      <Button variant="primary" disabled>
        Uitverkocht
      </Button>

      <IconButton aria-label="Voeg toe aan verlanglijst">♥</IconButton>
      <IconButton shape="rounded" aria-label="Aantal verhogen">
        +
      </IconButton>

      <Badge variant="sale">-17%</Badge>
      <Badge variant="new">Nieuw</Badge>
      <Badge variant="tip">Toptip</Badge>
      <Badge variant="bestseller">Bestseller</Badge>

      <Chip variant="spec">1 liter</Chip>
      <Chip variant="stock" dot>
        Op voorraad
      </Chip>
      <Chip variant="urgency">Nog 4 stuks</Chip>
      <Chip variant="award">Goud — World Whisky Awards</Chip>

      <Rating value={4.8} score={4.8} count={12000} />

      <SearchBar />

      <label htmlFor="a11y-textfield">E-mailadres</label>
      <TextField id="a11y-textfield" placeholder="jij@voorbeeld.nl" />

      <Alert tone="success" title="Gelukt" onClose={() => {}}>
        Toegevoegd aan winkelmandje.
      </Alert>
      <Alert tone="info" title="Let op">
        Nog 3 op voorraad.
      </Alert>
      <Alert tone="error" title="Mislukt">
        Probeer het opnieuw.
      </Alert>

      <Toast tone="success">Toegevoegd aan winkelmandje</Toast>
      <Toast tone="info">Prijs bijgewerkt</Toast>
      <Toast tone="error">Kon niet toevoegen</Toast>

      <ProductCard
        brand="Tanqueray"
        name="Tanqueray No. TEN 1L"
        price={34.95}
        oldPrice={39.95}
        reviews={412}
        saleBadge="−15%"
        onAdd={() => {}}
      />

      <PriceBlock
        price={74.95}
        oldPrice={89.95}
        showSavings
        perUnit="€107,07 / liter"
        note="Incl. btw, excl. verzendkosten"
      />

      <DeliveryNote countdown="5u 42m" threshold="Gratis vanaf €150" />

      <QuantityStepper value={2} onChange={() => {}} size="lg" />

      <CountrySelector value="NL" language="nl" />
      <LanguageSelector value="nl" />
    </div>
  );
}

describe('component library — axe-core a11y scan (jsdom)', () => {
  it('reports zero critical/serious violations across all 13 ported components', async () => {
    const { container } = render(<Harness />);

    const results = await axe.run(container, {
      rules: {
        // Deferred to a browser-based pass — see harness doc comment above.
        'color-contrast': { enabled: false },
        'target-size': { enabled: false },
      },
    });

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (criticalOrSerious.length > 0) {
      const detail = criticalOrSerious
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      throw new Error(`axe-core found critical/serious violations:\n${detail}`);
    }

    expect(criticalOrSerious).toEqual([]);
  });
});
