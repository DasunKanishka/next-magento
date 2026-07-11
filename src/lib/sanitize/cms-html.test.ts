import { describe, expect, it } from 'vitest';

import { sanitizeCmsHtml } from './cms-html';

describe('sanitizeCmsHtml', () => {
  it('returns an empty string for empty/nullish input', () => {
    expect(sanitizeCmsHtml('')).toBe('');
    expect(sanitizeCmsHtml(null)).toBe('');
    expect(sanitizeCmsHtml(undefined)).toBe('');
  });

  it('strips <script> tags entirely', () => {
    const out = sanitizeCmsHtml('<div>Hoi<script>alert(1)</script></div>');
    expect(out).toContain('Hoi');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('removes inline event-handler attributes but keeps the element', () => {
    const out = sanitizeCmsHtml('<img src="cat.jpg" onerror="alert(1)" alt="Kat">');
    expect(out).toContain('src="cat.jpg"');
    expect(out).toContain('alt="Kat"');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('strips javascript: URLs from links', () => {
    const out = sanitizeCmsHtml('<a href="javascript:alert(1)">Klik</a>');
    expect(out).toContain('Klik');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('drops <iframe> and <form> even when nested', () => {
    const out = sanitizeCmsHtml(
      '<div><iframe src="https://evil.example"></iframe><form action="/x"><p>Tekst</p></form></div>',
    );
    expect(out).toContain('Tekst');
    expect(out.toLowerCase()).not.toContain('<iframe');
    expect(out.toLowerCase()).not.toContain('<form');
  });

  it('preserves page-builder structural markup, layout hooks, and safe content', () => {
    const raw =
      '<div class="pagebuilder-column-group" data-content-type="row" style="background-color:#fff">' +
      '<figure><img src="/media/promo.jpg" alt="Aanbieding" loading="lazy"></figure>' +
      '<h3>Nieuw binnen</h3><ul><li>Whisky</li><li>Gin</li></ul>' +
      '<a href="/aanbiedingen" class="cta">Bekijk</a></div>';
    const out = sanitizeCmsHtml(raw);
    expect(out).toContain('class="pagebuilder-column-group"');
    expect(out).toContain('data-content-type="row"');
    expect(out).toContain('<figure>');
    expect(out).toContain('alt="Aanbieding"');
    expect(out).toContain('<h3>Nieuw binnen</h3>');
    expect(out).toContain('<li>Whisky</li>');
    expect(out).toContain('href="/aanbiedingen"');
  });
});
