import { createHash } from 'node:crypto';
import { BRIDGE_SCRIPT } from './bridge/bridge.js';

const BRIDGE_HASH = createHash('sha256').update(BRIDGE_SCRIPT).digest('base64');

/**
 * The first containment layer, enforced by the browser whatever the markup says.
 *
 * - `sandbox allow-scripts`: the page gets an opaque origin, with no access to the
 *   app, cookies or storage, no popups and no top-level navigation. Carrying it in
 *   the header means it still applies if the document is opened directly.
 * - `script-src` with a hash: only the bridge can run, so inline handlers and any
 *   script that survives the sanitizer are refused.
 * - `default-src 'none'`: nothing can load or send anything, including from CSS.
 * - `frame-ancestors`: only this app can embed the page.
 */
export function buildContentPolicy(webOrigin: string): string {
  return [
    'sandbox allow-scripts',
    "default-src 'none'",
    `script-src 'sha256-${BRIDGE_HASH}'`,
    "style-src 'unsafe-inline'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${webOrigin}`,
  ].join('; ');
}
