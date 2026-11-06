import { extractText } from './text-extractor.js';

describe('extractText', () => {
  it('returns prose without markup', () => {
    expect(extractText('<h1>Tides</h1><p>Low <em>and</em> high.</p>')).toBe(
      'Tides Low and high.',
    );
  });

  it('separates block elements so words do not run together', () => {
    expect(extractText('<p>one</p><p>two</p><ul><li>three</li></ul>')).toBe(
      'one two three',
    );
  });

  it('keeps a word whole across inline elements', () => {
    expect(extractText('<p><b>ti</b>de</p>')).toBe('tide');
  });

  it('ignores styles and scripts', () => {
    const html =
      '<style>.hidden { color: red }</style><script>steal()</script><p>Visible</p>';
    expect(extractText(html)).toBe('Visible');
  });

  it('ignores attributes', () => {
    expect(extractText('<a href="harbourlight.zz" title="beacon">go</a>')).toBe(
      'go',
    );
  });

  it('decodes entities', () => {
    expect(extractText('<p>Ink &amp; press</p>')).toBe('Ink & press');
  });

  it('survives unclosed tags', () => {
    expect(extractText('<p>open <div>still reading')).toBe(
      'open still reading',
    );
  });

  it('returns an empty string when there are no words', () => {
    expect(extractText('<hr><script>x()</script>')).toBe('');
  });
});
