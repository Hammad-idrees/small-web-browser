import sanitizeHtml from 'sanitize-html';

/**
 * What authors can write. Everything not listed is removed, so a new browser
 * feature is blocked until someone chooses to allow it.
 *
 * Cost to authors: no JavaScript, forms, embeds, images or external resources.
 * Headings, text, lists, tables, links and CSS all still work.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'abbr',
    'address',
    'article',
    'aside',
    'b',
    'blockquote',
    'br',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'dfn',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'footer',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hr',
    'i',
    'ins',
    'kbd',
    'li',
    'main',
    'mark',
    'nav',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'samp',
    'section',
    'small',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'u',
    'ul',
    'var',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'title', 'lang', 'dir'],
    a: ['href'],
    col: ['span'],
    colgroup: ['span'],
    details: ['open'],
    ol: ['start', 'reversed'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    time: ['datetime'],
  },
  allowedSchemes: ['http', 'https'],
  allowProtocolRelative: true,
  // Removed along with their contents, not just their tags.
  nonTextTags: [
    'script',
    'noscript',
    'textarea',
    'option',
    'select',
    'button',
    'title',
    'iframe',
    'object',
    'embed',
    'template',
  ],
  // `style` is flagged as risky because its contents are not escaped. It is allowed
  // because the content policy stops CSS from loading or sending anything.
  allowVulnerableTags: true,
};

/** Reduces untrusted HTML to the allowed subset. The second of three containment layers. */
export function sanitizeAuthorHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
