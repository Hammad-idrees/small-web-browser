import { BRIDGE_SCRIPT } from './bridge/bridge.js';
import { sanitizeAuthorHtml } from './sanitizer.js';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => HTML_ESCAPES[character] ?? '',
  );
}

/** The most room a viewer may ask for above a page, in pixels. */
export const MAX_TOP_INSET = 240;

interface BuildOptions {
  /**
   * Room above the page for the viewer's floating navbar, in whole pixels. It is
   * padding on <html>, so the page's own background fills it. An author's own
   * html padding, coming later, still wins.
   */
  readonly topInset?: number;
}

/**
 * Builds the complete document for a contained page. This is the only place author
 * HTML is turned into something displayed, and it always passes through the sanitizer.
 *
 * The bridge comes first, so nothing the author wrote can affect how it is parsed.
 */
export function buildDocument(
  page: { title: string; html: string },
  options: BuildOptions = {},
): string {
  const inset = Math.trunc(options.topInset ?? 0);
  const insetStyle =
    inset > 0 && inset <= MAX_TOP_INSET
      ? `<style>html{padding-top:${String(inset)}px}</style>`
      : '';

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(page.title)}</title>`,
    `<script>${BRIDGE_SCRIPT}</script>`,
    insetStyle,
    '</head>',
    `<body>${sanitizeAuthorHtml(page.html)}</body>`,
    '</html>',
  ].join('');
}
