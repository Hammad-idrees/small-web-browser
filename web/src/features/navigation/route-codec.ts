import { normalizeAddress } from '@small-web/contracts';

/** Somewhere that can be asked for. What an address turns out to hold is not known yet. */
export type Route =
  | { readonly kind: 'home' }
  | { readonly kind: 'address'; readonly address: string }
  | { readonly kind: 'search'; readonly query: string }
  | { readonly kind: 'history' }
  | { readonly kind: 'publish' };

const ADDRESS_PREFIX = '/site/';

/** The URL for a route. The real address bar always shows this. */
export function encodeRoute(route: Route): string {
  switch (route.kind) {
    case 'home':
      return '/';
    case 'address':
      return `${ADDRESS_PREFIX}${encodeURIComponent(route.address)}`;
    case 'search': {
      const query = new URLSearchParams({ q: route.query }).toString();
      return `/search?${query}`;
    }
    case 'history':
      return '/history';
    case 'publish':
      return '/publish';
  }
}

/**
 * The route for a URL, or null if the URL means nothing to this app.
 *
 * A link can point at something that is not address-shaped, such as
 * `tidepool.zz/about`. That is kept as written, so it can lead nowhere and say so.
 */
export function decodeRoute(pathname: string, search = ''): Route | null {
  switch (pathname) {
    case '/':
      return { kind: 'home' };
    case '/history':
      return { kind: 'history' };
    case '/publish':
      return { kind: 'publish' };
    case '/search':
      return {
        kind: 'search',
        query: new URLSearchParams(search).get('q') ?? '',
      };
  }

  if (!pathname.startsWith(ADDRESS_PREFIX)) return null;

  const raw = decodeSegment(pathname.slice(ADDRESS_PREFIX.length));
  if (raw === null || raw.trim() === '') return null;

  return { kind: 'address', address: normalizeAddress(raw) ?? raw };
}

/**
 * Where text typed into the address bar leads, or null if nothing was typed.
 * As in a real browser, something that looks like an address is treated as one even
 * if it turns out to lead nowhere, and anything else is a search.
 */
export function routeFromInput(input: string): Route | null {
  const text = input.trim();
  if (text === '') return null;

  const address = normalizeAddress(text);
  if (address !== null) return { kind: 'address', address };

  const looksLikeAddress = !/\s/.test(text) && text.includes('.');
  return looksLikeAddress
    ? { kind: 'address', address: text }
    : { kind: 'search', query: text };
}

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
