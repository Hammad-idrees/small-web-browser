import { createHash } from 'node:crypto';
import { BRIDGE_SCRIPT } from './bridge/bridge.js';
import { buildContentPolicy } from './content-policy.js';

describe('buildContentPolicy', () => {
  const policy = buildContentPolicy('http://localhost:3000');
  const directives = policy.split('; ');

  it('sandboxes without same-origin, popups, forms or top navigation', () => {
    expect(directives).toContain('sandbox allow-scripts');
    for (const forbidden of [
      'allow-same-origin',
      'allow-top-navigation',
      'allow-popups',
      'allow-forms',
      'allow-modals',
    ]) {
      expect(policy).not.toContain(forbidden);
    }
  });

  it('blocks everything by default', () => {
    expect(directives).toContain("default-src 'none'");
    expect(directives).toContain("base-uri 'none'");
    expect(directives).toContain("form-action 'none'");
  });

  it('allows exactly one script, by the hash of the bridge', () => {
    const hash = createHash('sha256').update(BRIDGE_SCRIPT).digest('base64');
    expect(directives).toContain(`script-src 'sha256-${hash}'`);
    expect(policy).not.toContain("script-src 'unsafe-inline'");
    expect(policy).not.toContain('unsafe-eval');
  });

  it('allows inline styles and no other kind of resource', () => {
    expect(directives).toContain("style-src 'unsafe-inline'");
    for (const directive of [
      'img-src',
      'font-src',
      'connect-src',
      'media-src',
    ]) {
      expect(policy).not.toContain(directive);
    }
  });

  it('can only be embedded by the app', () => {
    expect(directives).toContain('frame-ancestors http://localhost:3000');
  });
});
