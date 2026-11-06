import { BRIDGE_SCRIPT } from './bridge/bridge.js';
import { buildDocument } from './document-builder.js';

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

  it('cannot be ended early by the author', () => {
    const output = buildDocument({
      title: 'x',
      html: '</body></html><p>after</p>',
    });
    expect(output.endsWith('<body><p>after</p></body></html>')).toBe(true);
  });
});
