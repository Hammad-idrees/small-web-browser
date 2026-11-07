import { buildSnippet, termRoots } from './snippet.js';

/** The highlighted words, as the reader would see them. */
const marked = (result: ReturnType<typeof buildSnippet>) =>
  result.highlights.map(({ start, length }) =>
    result.snippet.slice(start, start + length),
  );

describe('termRoots', () => {
  it.each([
    ['tide', ['tide']],
    ['Tides', ['tide']],
    ['tide pools', ['tide', 'pool']],
    ['lighthouse keeping', ['lighthouse', 'keep']],
    ['moss -garden', ['moss']],
    ['boxes', ['box']],
    ['marshes', ['marsh']],
    ['passed', ['pass']],
    ['ferries', ['ferrie']],
    ['"night ferry"', ['night', 'ferry']],
    ['a', []],
    ['tide tide TIDE', ['tide']],
  ])('%j gives %j', (query, roots) => {
    expect(termRoots(query)).toEqual(roots);
  });
});

describe('buildSnippet', () => {
  const long = `${'Opening words that say nothing much at all. '.repeat(10)}The cormorant stands on its post with wings held open. ${'Closing words that also say nothing. '.repeat(10)}`;

  it('centres on the first match, with ellipses where it was cut', () => {
    const result = buildSnippet(long, 'cormorant');
    expect(result.snippet.startsWith('… ')).toBe(true);
    expect(result.snippet.endsWith(' …')).toBe(true);
    expect(result.snippet).toContain('The cormorant stands');
    expect(result.snippet.length).toBeLessThan(260);
  });

  it('marks exactly the matching words', () => {
    expect(marked(buildSnippet(long, 'cormorant'))).toEqual(['cormorant']);
  });

  it('marks other forms of the same word', () => {
    const result = buildSnippet(
      'The tide turns. Tides are high. Tidepools fill.',
      'tides',
    );
    expect(marked(result)).toEqual(['tide', 'Tides', 'Tidepools']);
  });

  it('does not mark a match inside another word', () => {
    expect(marked(buildSnippet('A stride, not a tide.', 'tide'))).toEqual([
      'tide',
    ]);
  });

  it('starts at the beginning when the match is near the top', () => {
    const result = buildSnippet('The cormorant stands still.', 'cormorant');
    expect(result.snippet).toBe('The cormorant stands still.');
  });

  it('shows the opening when nothing in the text matches the roots', () => {
    const result = buildSnippet(long, 'zzz');
    expect(result.snippet.startsWith('Opening words')).toBe(true);
    expect(result.highlights).toEqual([]);
  });

  it('treats regular expression characters in a query as plain text', () => {
    expect(() => buildSnippet(long, '(.*)+ [tide')).not.toThrow();
    expect(marked(buildSnippet('a [tide here', '[tide'))).toEqual(['tide']);
  });

  it('cuts on a word boundary', () => {
    const result = buildSnippet(long, 'cormorant');
    const body = result.snippet.replace(/^… /, '').replace(/ …$/, '');
    expect(long).toContain(body);
    expect(long.charAt(long.indexOf(body) - 1)).toBe(' ');
  });
});
