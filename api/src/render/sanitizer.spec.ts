import { HOSTILE_ADDRESS, SITES } from '../seed/data/sites.js';
import { sanitizeAuthorHtml } from './sanitizer.js';

describe('sanitizeAuthorHtml', () => {
  describe('removes every escape attempt', () => {
    it.each([
      ['script element', '<script>alert(1)</script>', 'alert'],
      ['script with odd casing', '<ScRiPt>alert(1)</sCrIpT>', 'alert'],
      ['unclosed script', '<script>alert(1)', 'alert'],
      ['inline click handler', '<p onclick="alert(1)">x</p>', 'onclick'],
      ['image error handler', '<img src=x onerror="alert(1)">', 'onerror'],
      ['svg load handler', '<svg onload="alert(1)"></svg>', 'onload'],
      ['svg script', '<svg><script>alert(1)</script></svg>', 'alert'],
      ['javascript link', '<a href="javascript:alert(1)">x</a>', 'javascript'],
      ['mixed-case javascript', '<a href="JaVaScRiPt:alert(1)">x</a>', 'alert'],
      [
        'entity-hidden javascript',
        '<a href="jav&#x61;script:alert(1)">x</a>',
        'alert',
      ],
      [
        'whitespace-hidden javascript',
        '<a href="java\tscript:alert(1)">x</a>',
        'alert',
      ],
      ['data link', '<a href="data:text/html,hello">x</a>', 'data:'],
      [
        'meta refresh',
        '<meta http-equiv="refresh" content="0;url=//x.zz">',
        'refresh',
      ],
      ['base rewrite', '<base href="https://example.com/">', 'base'],
      [
        'stylesheet link',
        '<link rel="stylesheet" href="//x.zz/a.css">',
        'stylesheet',
      ],
      ['nested frame', '<iframe src="https://example.com"></iframe>', 'iframe'],
      ['frame fallback text', '<iframe>fallback</iframe>', 'fallback'],
      ['object', '<object data="//x.zz/a"></object>', 'object'],
      ['embed', '<embed src="//x.zz/a">', 'embed'],
      ['form', '<form action="//x.zz/c"><input name="p"></form>', 'action'],
      ['input', '<input name="password">', 'password'],
      ['button text', '<button>Log in</button>', 'Log in'],
      ['image', '<img src="https://example.com/t.png">', 'img'],
      ['video', '<video src="//x.zz/v.mp4"></video>', 'video'],
      [
        'new window target',
        '<a href="tidepool.zz" target="_blank">x</a>',
        'target',
      ],
      ['tracking ping', '<a href="tidepool.zz" ping="//x.zz">x</a>', 'ping'],
      [
        'download attribute',
        '<a href="tidepool.zz" download>x</a>',
        'download',
      ],
      ['html comment', '<!-- secret -->', 'secret'],
      ['template', '<template><p>hidden</p></template>', 'hidden'],
      ['title', '<title>tab title</title>', 'tab title'],
    ])('%s', (_name, input, forbidden) => {
      expect(sanitizeAuthorHtml(input)).not.toContain(forbidden);
    });

    it('cannot break out of its place in the document', () => {
      const output = sanitizeAuthorHtml(
        '</body></html><html><head></head><body><p>after</p>',
      );
      expect(output).toBe('<p>after</p>');
    });

    it('closes whatever the author left open', () => {
      expect(sanitizeAuthorHtml('<div><p>open')).toBe('<div><p>open</p></div>');
    });

    it('does not let a style element smuggle a script out', () => {
      const output = sanitizeAuthorHtml(
        '<style>p{}</style><script>alert(1)</script>',
      );
      expect(output).toBe('<style>p{}</style>');
    });
  });

  describe('keeps what authors can write', () => {
    it.each([
      ['headings and text', '<h1>Tides</h1><p>Low <em>and</em> high.</p>'],
      ['style elements', '<style>h1 { color: red; }</style>'],
      ['inline styles', '<p style="color:red">x</p>'],
      ['classes and ids', '<p class="note" id="top">x</p>'],
      ['lists', '<ol start="3"><li>x</li></ol>'],
      ['tables', '<table><tr><td colspan="2">x</td></tr></table>'],
      ['disclosure', '<details open><summary>x</summary>y</details>'],
      ['bare address links', '<a href="tidepool.zz">x</a>'],
      ['full address links', '<a href="http://saltmarsh.zz/">x</a>'],
      ['in-page links', '<a href="#top">x</a>'],
    ])('%s', (_name, input) => {
      expect(sanitizeAuthorHtml(input)).toBe(input);
    });
  });

  it('leaves an honest page reading the same', () => {
    const tidepool = SITES.find((site) => site.address === 'tidepool.zz');
    const output = sanitizeAuthorHtml(tidepool?.html ?? '');
    expect(output).toContain('<h1>The Tide Pool Journal</h1>');
    expect(output).toContain('<a href="harbourlight.zz">');
    expect(output).toContain('color: #0f5c63');
  });

  it('reduces the seeded hostile site to harmless prose', () => {
    const hostile = SITES.find((site) => site.address === HOSTILE_ADDRESS);
    const output = sanitizeAuthorHtml(hostile?.html ?? '');

    for (const forbidden of [
      '<script',
      'escapehatch',
      'onclick',
      'onerror',
      'onload',
      'javascript:',
      'http-equiv',
      '<base',
      '<iframe',
      '<object',
      '<embed',
      '<form',
      '<input',
      '<img',
      'target=',
    ]) {
      expect(output, forbidden).not.toContain(forbidden);
    }
    expect(output).toContain('ordinary garden shed');
    expect(output).toContain('<a href="tidepool.zz">');
  });
});
