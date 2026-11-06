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

/**
 * Builds the complete document for a contained page. This is the only place author
 * HTML is turned into something displayed, and it always passes through the sanitizer.
 *
 * The bridge comes first, so nothing the author wrote can affect how it is parsed.
 */
export function buildDocument(page: { title: string; html: string }): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(page.title)}</title>`,
    `<script>${BRIDGE_SCRIPT}</script>`,
    '</head>',
    `<body>${sanitizeAuthorHtml(page.html)}</body>`,
    '</html>',
  ].join('');
}
