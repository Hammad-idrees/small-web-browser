import type { Highlight } from '@small-web/contracts';

const WINDOW = 240;
const LEAD = 90;
const MIN_ROOT = 3;

/**
 * The roots of the words in a query, so `tides` and `tide` find each other the way
 * the search index does. Words marked to be excluded, like `-moss`, are left out.
 */
export function termRoots(query: string): string[] {
  const roots = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !word.startsWith('-'))
    .flatMap((word) => word.match(/[\p{L}\p{N}]+/gu) ?? [])
    .map(rootOf)
    .filter((root) => root.length >= 2);
  return [...new Set(roots)];
}

/**
 * A short stretch of the page around its first match, with every match in it
 * marked. Plain text in, plain text out: it is shown as text, never as HTML.
 */
export function buildSnippet(
  text: string,
  query: string,
): { snippet: string; highlights: Highlight[] } {
  const roots = termRoots(query);
  const pattern =
    roots.length > 0
      ? new RegExp(
          `(?<![\\p{L}\\p{N}])(?:${roots.map(escapeRegExp).join('|')})[\\p{L}\\p{N}]*`,
          'giu',
        )
      : null;

  const first = pattern ? text.search(pattern) : -1;
  let start = first > LEAD ? wordStartAfter(text, first - LEAD) : 0;
  let end = Math.min(text.length, start + WINDOW);
  if (end < text.length) end = wordEndBefore(text, end, start);
  if (start >= end) start = 0;

  const body = text.slice(start, end).trim();
  const prefix = start > 0 ? '… ' : '';
  const suffix = end < text.length ? ' …' : '';
  const snippet = `${prefix}${body}${suffix}`;

  const highlights: Highlight[] = [];
  if (pattern) {
    for (const match of body.matchAll(pattern)) {
      highlights.push({
        start: prefix.length + (match.index ?? 0),
        length: match[0].length,
      });
    }
  }
  return { snippet, highlights };
}

/** A light, English-only stem: enough to find `keep` in `keeping`, not a full stemmer. */
function rootOf(word: string): string {
  // Only one ending is ever removed: the first of these that applies.
  const endings = [/ing$/, /ed$/, /(?<=(?:s|x|z|ch|sh))es$/, /(?<!s)s$/];
  const ending = endings.find((pattern) => pattern.test(word));
  const root = ending ? word.replace(ending, '') : word;
  return root.length >= MIN_ROOT ? root : word;
}

function wordStartAfter(text: string, index: number): number {
  const space = text.indexOf(' ', index);
  return space === -1 ? index : space + 1;
}

function wordEndBefore(text: string, index: number, floor: number): number {
  const space = text.lastIndexOf(' ', index);
  return space > floor ? space : index;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
