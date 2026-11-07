import { describe, expect, it } from 'vitest';
import {
  decodeRoute,
  encodeRoute,
  type Route,
  routeFromInput,
} from './route-codec';

describe('routeFromInput', () => {
  it.each<[string, Route]>([
    ['tidepool.zz', { kind: 'address', address: 'tidepool.zz' }],
    ['  TIDEPOOL.zz ', { kind: 'address', address: 'tidepool.zz' }],
    ['http://tidepool.zz/', { kind: 'address', address: 'tidepool.zz' }],
    ['never-existed.zz', { kind: 'address', address: 'never-existed.zz' }],
    ['tidepool.zz/about', { kind: 'address', address: 'tidepool.zz/about' }],
    ['lighthouse', { kind: 'search', query: 'lighthouse' }],
    ['tide pools', { kind: 'search', query: 'tide pools' }],
    ['what is tidepool.zz', { kind: 'search', query: 'what is tidepool.zz' }],
  ])('%j leads to %j', (input, route) => {
    expect(routeFromInput(input)).toEqual(route);
  });

  it.each(['', '   '])('%j leads nowhere at all', (input) => {
    expect(routeFromInput(input)).toBeNull();
  });
});

/** Reads a URL string the way the browser would split it. */
function decodeUrl(url: string): Route | null {
  const { pathname, search } = new URL(url, 'http://app.test');
  return decodeRoute(pathname, search);
}

describe('encodeRoute', () => {
  it.each<[Route, string]>([
    [{ kind: 'home' }, '/'],
    [{ kind: 'address', address: 'tidepool.zz' }, '/site/tidepool.zz'],
    [{ kind: 'history' }, '/history'],
    [{ kind: 'publish' }, '/publish'],
    [{ kind: 'search', query: 'tide' }, '/search?q=tide'],
    [{ kind: 'search', query: '' }, '/search?q='],
  ])('%j becomes %s', (route, url) => {
    expect(encodeRoute(route)).toBe(url);
  });

  it('keeps a hostile address inside its own path segment', () => {
    const url = encodeRoute({ kind: 'address', address: '../../evil?x=1#y' });
    expect(url).toBe('/site/..%2F..%2Fevil%3Fx%3D1%23y');
  });

  it('can never produce a URL that leaves this app', () => {
    for (const address of ['//evil.zz', 'https://evil.zz', '\\\\evil.zz']) {
      const url = encodeRoute({ kind: 'address', address });
      expect(new URL(url, 'http://app.test').origin).toBe('http://app.test');
    }
  });
});

describe('decodeRoute', () => {
  it.each<[string, Route]>([
    ['/', { kind: 'home' }],
    ['/history', { kind: 'history' }],
    ['/publish', { kind: 'publish' }],
    ['/search', { kind: 'search', query: '' }],
    ['/search?q=tide', { kind: 'search', query: 'tide' }],
    ['/search?q=tide+pool', { kind: 'search', query: 'tide pool' }],
    ['/site/tidepool.zz', { kind: 'address', address: 'tidepool.zz' }],
  ])('%s', (url, route) => {
    expect(decodeUrl(url)).toEqual(route);
  });

  it('puts an address into its canonical form', () => {
    expect(decodeUrl('/site/TIDEPOOL.zz')).toEqual({
      kind: 'address',
      address: 'tidepool.zz',
    });
    expect(decodeUrl('/site/http%3A%2F%2Ftidepool.zz%2F')).toEqual({
      kind: 'address',
      address: 'tidepool.zz',
    });
  });

  it('keeps something not address-shaped as written, so it can lead nowhere', () => {
    expect(decodeUrl('/site/tidepool.zz%2Fabout')).toEqual({
      kind: 'address',
      address: 'tidepool.zz/about',
    });
  });

  it.each([
    ['an unknown path', '/nope'],
    ['a nested unknown path', '/history/old'],
    ['an empty address', '/site/'],
    ['a blank address', '/site/%20'],
    ['broken percent-encoding', '/site/%E0%A4%A'],
  ])('rejects %s', (_name, pathname) => {
    expect(decodeRoute(pathname)).toBeNull();
  });
});

describe('round trips', () => {
  it.each<[Route]>([
    [{ kind: 'home' }],
    [{ kind: 'history' }],
    [{ kind: 'publish' }],
    [{ kind: 'address', address: 'tidepool.zz' }],
    [{ kind: 'address', address: 'tidepool.zz/about' }],
    [{ kind: 'search', query: 'tide' }],
    [{ kind: 'search', query: '' }],
    [{ kind: 'search', query: 'tide & pool = 100% #1?' }],
    [{ kind: 'search', query: 'مد و جزر' }],
  ])('%j survives', (route) => {
    expect(decodeUrl(encodeRoute(route))).toEqual(route);
  });
});
