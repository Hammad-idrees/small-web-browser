import type { NavigatorEnvironment } from './navigator';

/**
 * The real browser history. Each entry carries the id of its trail entry, so that
 * when the browser moves, by any button or gesture, the trail knows where to.
 *
 * These are native calls on purpose: Next.js supports them, keeping its own state
 * alongside ours, and it does not refetch or remount the page.
 */
export const browserHistory: NavigatorEnvironment['history'] = {
  currentEntryId: () => entryIdFrom(window.history.state),

  location: () => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }),

  push: (entryId, url) => {
    window.history.pushState({ entryId }, '', url);
  },

  replace: (entryId, url) => {
    window.history.replaceState({ entryId }, '', url);
  },

  back: () => {
    window.history.back();
  },

  forward: () => {
    window.history.forward();
  },

  listen: (listener) => {
    const onPopState = (event: PopStateEvent) => {
      listener(entryIdFrom(event.state));
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  },
};

function entryIdFrom(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  const { entryId } = state as { entryId?: unknown };
  return typeof entryId === 'string' ? entryId : null;
}
