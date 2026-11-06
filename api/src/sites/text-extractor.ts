import { Parser } from 'htmlparser2';

/** Elements whose contents a reader never sees as prose. */
const HIDDEN_ELEMENTS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'object',
  'embed',
  'head',
  'title',
]);

/** Elements that sit inside a word's flow, so `<b>ti</b>de` stays one word. */
const INLINE_ELEMENTS = new Set([
  'a',
  'abbr',
  'b',
  'cite',
  'code',
  'em',
  'i',
  'kbd',
  'mark',
  'q',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
]);

/** The words a reader would see on a page, without markup, styles or scripts. */
export function extractText(html: string): string {
  const chunks: string[] = [];
  let hiddenDepth = 0;

  const parser = new Parser({
    onopentagname(name) {
      if (HIDDEN_ELEMENTS.has(name)) hiddenDepth += 1;
      if (!INLINE_ELEMENTS.has(name)) chunks.push(' ');
    },
    ontext(text) {
      if (hiddenDepth === 0) chunks.push(text);
    },
    onclosetag(name) {
      if (HIDDEN_ELEMENTS.has(name)) hiddenDepth -= 1;
      if (!INLINE_ELEMENTS.has(name)) chunks.push(' ');
    },
  });
  parser.write(html);
  parser.end();

  return chunks.join('').replace(/\s+/g, ' ').trim();
}
