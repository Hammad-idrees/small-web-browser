import { BRIDGE_SCRIPT } from './bridge/bridge.js';
import { buildDocument, MAX_TOP_INSET } from './document-builder.js';

describe('buildDocument', () => {
  it('places the page inside a complete document', () => {
    const output = buildDocument({ title: 'Tides', html: '<p>Low</p>' });
    expect(output.startsWith('<!doctype html>')).toBe(true);
    expect(output).toContain('<title>Tides</title>');
    expect(output).toContain('<body><p>Low</p></body>');
  });

  it('includes the bridge exactly, so its hash still matches', () => {
    const output = buildDocument({ title: 'x', html: '' });
    expect(output).toContain(`<script>${BRIDGE_SCRIPT}</script>`);
  });

  it('puts the bridge before any author markup', () => {
    const output = buildDocument({ title: 'x', html: '<p>author</p>' });
    expect(output.indexOf(BRIDGE_SCRIPT)).toBeLessThan(
      output.indexOf('<p>author</p>'),
    );
  });

  it('sanitizes the page, leaving the bridge as the only script', () => {
    const output = buildDocument({
      title: 'x',
      html: '<script>alert(1)</script><p>ok</p>',
    });
    expect(output.match(/<script/g)).toHaveLength(1);
    expect(output).not.toContain('alert(1)');
  });

  it('escapes a title that tries to break out', () => {
    const output = buildDocument({
      title: '</title><script>alert(1)</script>',
      html: '',
    });
    expect(output.match(/<script/g)).toHaveLength(1);
    expect(output).toContain('&lt;/title&gt;');
  });

  it('adds no room above the page unless asked', () => {
    const output = buildDocument({ title: 'x', html: '<p>ok</p>' });
    expect(output).not.toContain('padding-top');
  });

  it('makes room above the page for a floating navbar, in the head', () => {
    const output = buildDocument(
      { title: 'x', html: '<p>ok</p>' },
      { topInset: 96 },
    );
    expect(output).toContain('<style>html{padding-top:96px}</style></head>');
  });

  it('places the room before the author, so an author’s own style still wins', () => {
    const output = buildDocument(
      { title: 'x', html: '<style>html{padding:0}</style><p>ok</p>' },
      { topInset: 96 },
    );
    expect(output.indexOf('padding-top:96px')).toBeLessThan(
      output.indexOf('html{padding:0}'),
    );
  });

  it('ignores room that is negative or too large', () => {
    for (const topInset of [-10, 0, MAX_TOP_INSET + 1, Number.NaN]) {
      const output = buildDocument({ title: 'x', html: '' }, { topInset });
      expect(output).not.toContain('padding-top');
    }
  });

  it('cannot be ended early by the author', () => {
    const output = buildDocument({
      title: 'x',
      html: '</body></html><p>after</p>',
    });
    expect(output.endsWith('<body><p>after</p></body></html>')).toBe(true);
  });
});
