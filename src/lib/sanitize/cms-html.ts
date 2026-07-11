import 'server-only';

import DOMPurify from 'isomorphic-dompurify';

/**
 * Server-side sanitizer for admin-authored CMS HTML.
 *
 * Every string sourced from a CMS block crosses a trust boundary and MUST pass
 * through this function before it is ever handed to `dangerouslySetInnerHTML` —
 * raw, unsanitized CMS HTML is never injected. `import 'server-only'` keeps the
 * sanitizer (and its DOM implementation) off the client bundle: sanitization
 * happens once, server-side, and only the cleaned string reaches the browser.
 *
 * The allow-list is scoped to the structural + text markup the page-builder
 * editor emits (layout wrappers, media, headings, lists, tables, inline
 * emphasis, links) plus its layout hooks (`class`, `style`, `data-*`). Anything
 * outside the list — `<script>`, `<iframe>`, `<form>`, inline event handlers
 * (`onerror`, `onclick`, …), and `javascript:` URLs — is stripped.
 */

/** Structural + text tags the page-builder editor is allowed to emit. */
const ALLOWED_TAGS = [
  'a',
  'p',
  'br',
  'hr',
  'span',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'figure',
  'figcaption',
  'picture',
  'source',
  'img',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'small',
  'sub',
  'sup',
  'mark',
  'blockquote',
  'cite',
  'q',
  'time',
  'address',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
];

/**
 * Attributes the editor relies on. `class`/`style`/`data-*` carry the
 * page-builder layout; media + link attributes carry content. Event-handler
 * attributes are deliberately absent, so any `on*` handler is dropped.
 */
const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'srcset',
  'sizes',
  'alt',
  'title',
  'class',
  'id',
  'style',
  'role',
  'width',
  'height',
  'loading',
  'type',
  'aria-label',
  'aria-hidden',
  'aria-describedby',
  'datetime',
];

/**
 * Sanitize a CMS HTML string. Returns `''` for empty/nullish input so callers
 * can render the result unconditionally. `data-*` attributes are kept (the
 * page-builder layout depends on them); `javascript:`/`data:`-scheme scripting
 * and event handlers are removed by the underlying purifier.
 */
export function sanitizeCmsHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'textarea',
      'select',
      'button',
      'link',
      'meta',
      'base',
    ],
  });
}
