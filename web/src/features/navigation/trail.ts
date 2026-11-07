import { encodeRoute, type Route } from './route-codec';

/**
 * The trail is the list behind Back and Forward: where this tab has been, and where
 * in that list it is now. It is not the history. History is a permanent record of
 * arrivals, while moving along the trail is not an arrival at all.
 *
 * This file is pure: no React, no browser and no clock. Every rule about Back and
 * Forward lives here, so all of them can be proved by tests.
 */

/** What was actually shown. `versionId` pins the exact page, so Back returns to it. */
export type TrailLocation =
  | { readonly kind: 'home' }
  | { readonly kind: 'search'; readonly query: string }
  | { readonly kind: 'history' }
  | { readonly kind: 'publish' }
  | { readonly kind: 'nowhere'; readonly address: string }
  | {
      readonly kind: 'site';
      readonly address: string;
      readonly versionId: string;
      readonly title: string;
      readonly authorName: string;
    };

export interface TrailEntry {
  readonly id: string;
  /** The person browsing. A trail belongs to one person at a time. */
  readonly ownerId: string;
  readonly location: TrailLocation;
  readonly scrollY: number;
}

/** A navigation that has been asked for and not yet shown. */
export interface PendingNavigation {
  readonly requestId: string;
  readonly route: Route;
}

export interface Trail {
  readonly entries: readonly TrailEntry[];
  /** Position in `entries`, or -1 before anything has been shown. */
  readonly index: number;
  readonly pending: PendingNavigation | null;
}

export type TrailAction =
  | {
      readonly type: 'begin';
      readonly requestId: string;
      readonly route: Route;
    }
  | {
      readonly type: 'commit';
      readonly requestId: string;
      readonly entry: Omit<TrailEntry, 'scrollY'>;
    }
  | { readonly type: 'fail'; readonly requestId: string }
  | { readonly type: 'traverse'; readonly entryId: string }
  | {
      readonly type: 'saveScroll';
      readonly entryId: string;
      readonly y: number;
    };

/** Keeps a very long session from growing without limit in storage. */
export const MAX_ENTRIES = 100;

export const EMPTY_TRAIL: Trail = { entries: [], index: -1, pending: null };

export function currentEntry(trail: Trail): TrailEntry | null {
  return trail.entries[trail.index] ?? null;
}

/** The entry Back would go to. It stops where the trail changed hands. */
export function entryBehind(trail: Trail): TrailEntry | null {
  return sameOwnerAsCurrent(trail, trail.entries[trail.index - 1]);
}

/** The entry Forward would go to. It stops where the trail changed hands. */
export function entryAhead(trail: Trail): TrailEntry | null {
  return sameOwnerAsCurrent(trail, trail.entries[trail.index + 1]);
}

function sameOwnerAsCurrent(
  trail: Trail,
  entry: TrailEntry | undefined,
): TrailEntry | null {
  if (!entry || entry.ownerId !== currentEntry(trail)?.ownerId) return null;
  return entry;
}

/** The route a location can be asked for again by. */
export function routeOf(location: TrailLocation): Route {
  switch (location.kind) {
    case 'site':
    case 'nowhere':
      return { kind: 'address', address: location.address };
    case 'search':
      return { kind: 'search', query: location.query };
    default:
      return { kind: location.kind };
  }
}

/**
 * Whether showing `entry` adds to the trail or stands in for where we already are.
 * As in a real browser, going again to the page you are on is not a new step: it
 * replaces the current entry, and Forward survives.
 */
export function commitMode(
  trail: Trail,
  entry: Pick<TrailEntry, 'ownerId' | 'location'>,
): 'push' | 'replace' {
  const current = currentEntry(trail);
  const samePlace =
    current !== null &&
    current.ownerId === entry.ownerId &&
    encodeRoute(routeOf(current.location)) ===
      encodeRoute(routeOf(entry.location));
  return samePlace ? 'replace' : 'push';
}

export function trailReducer(trail: Trail, action: TrailAction): Trail {
  switch (action.type) {
    case 'begin':
      // The newest request wins. Anything still in flight can no longer commit.
      return {
        ...trail,
        pending: { requestId: action.requestId, route: action.route },
      };

    case 'commit':
      return commit(trail, action.requestId, action.entry);

    case 'fail':
      return trail.pending?.requestId === action.requestId
        ? { ...trail, pending: null }
        : trail;

    case 'traverse':
      return traverse(trail, action.entryId);

    case 'saveScroll':
      return saveScroll(trail, action.entryId, action.y);
  }
}

function commit(
  trail: Trail,
  requestId: string,
  newEntry: Omit<TrailEntry, 'scrollY'>,
): Trail {
  // A response to anything but the latest request arrived too late to be shown.
  if (trail.pending?.requestId !== requestId) return trail;

  const entry: TrailEntry = { ...newEntry, scrollY: 0 };

  if (commitMode(trail, entry) === 'replace') {
    return {
      entries: trail.entries.map((existing, position) =>
        position === trail.index ? entry : existing,
      ),
      index: trail.index,
      pending: null,
    };
  }

  // Going somewhere new from the middle of the trail loses everything ahead.
  const kept = trail.entries.slice(0, trail.index + 1);
  const entries = [...kept, entry].slice(-MAX_ENTRIES);

  return { entries, index: entries.length - 1, pending: null };
}

function traverse(trail: Trail, entryId: string): Trail {
  const index = trail.entries.findIndex((entry) => entry.id === entryId);
  if (index === -1) return trail;
  if (index === trail.index && trail.pending === null) return trail;

  // Moving along the trail abandons whatever was still loading.
  return { ...trail, index, pending: null };
}

function saveScroll(trail: Trail, entryId: string, y: number): Trail {
  if (!Number.isFinite(y) || y < 0) return trail;

  const target = trail.entries.find((entry) => entry.id === entryId);
  if (!target || target.scrollY === y) return trail;

  return {
    ...trail,
    entries: trail.entries.map((entry) =>
      entry === target ? { ...entry, scrollY: y } : entry,
    ),
  };
}
