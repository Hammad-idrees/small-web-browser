import type { Person, SiteSummary } from '@small-web/contracts';
import { decodeRoute, encodeRoute, type Route } from './route-codec';
import {
  commitMode,
  currentEntry,
  EMPTY_TRAIL,
  entryAhead,
  entryBehind,
  routeOf,
  type Trail,
  type TrailAction,
  type TrailLocation,
  trailReducer,
} from './trail';

/** Everything the navigator needs from outside, so tests can stand in for the browser. */
export interface NavigatorEnvironment {
  readonly history: {
    currentEntryId(): string | null;
    location(): { pathname: string; search: string };
    push(entryId: string, url: string): void;
    replace(entryId: string, url: string): void;
    back(): void;
    forward(): void;
    /** Calls back with the entry the browser moved to, by any means. */
    listen(listener: (entryId: string | null) => void): () => void;
  };
  readonly storage: {
    load(): Trail | null;
    save(trail: Trail): void;
  };
  readonly api: {
    listPeople(): Promise<Person[]>;
    /** Resolves to null when nothing lives at the address. Rejects if it cannot be reached. */
    resolveAddress(
      address: string,
      signal: AbortSignal,
    ): Promise<SiteSummary | null>;
  };
  createId(): string;
}

type HistoryMode = 'auto' | 'replace';

interface FailedNavigation {
  readonly route: Route;
  readonly ownerId: string;
  readonly historyMode: HistoryMode;
}

export interface NavigatorSnapshot {
  readonly status: 'booting' | 'ready' | 'offline';
  readonly people: readonly Person[];
  readonly trail: Trail;
  readonly personId: string | null;
  readonly failure: FailedNavigation | null;
}

const INITIAL_SNAPSHOT: NavigatorSnapshot = {
  status: 'booting',
  people: [],
  trail: EMPTY_TRAIL,
  personId: null,
  failure: null,
};

/**
 * Connects the pure trail to the outside world. The rule that keeps Back and Forward
 * right lives here: the app's Back button only asks the browser to go back, and every
 * move along the trail, from any button, arrives through one browser event. The two
 * can never disagree, because there is only one path.
 */
export class Navigator {
  private snapshot = INITIAL_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private inflight: AbortController | null = null;
  private booted = false;
  private traversing = false;

  constructor(private readonly environment: NavigatorEnvironment) {}

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): NavigatorSnapshot => this.snapshot;

  /** Starts listening to the browser. Returns a function that stops it. */
  readonly connect = (): (() => void) => {
    const stop = this.environment.history.listen(this.handleBrowserMove);
    if (!this.booted) {
      this.booted = true;
      void this.boot();
    }
    return stop;
  };

  readonly retryBoot = (): void => {
    this.update({ status: 'booting' });
    void this.boot();
  };

  readonly navigate = (route: Route): void => {
    const ownerId = this.snapshot.personId;
    if (ownerId !== null) void this.go(route, ownerId, 'auto');
  };

  readonly goBack = (): void => {
    if (this.traversing || !entryBehind(this.snapshot.trail)) return;
    this.traversing = true;
    this.environment.history.back();
  };

  readonly goForward = (): void => {
    if (this.traversing || !entryAhead(this.snapshot.trail)) return;
    this.traversing = true;
    this.environment.history.forward();
  };

  /** Starts a new trail for someone else. Their history is their own. */
  readonly switchPerson = (personId: string): void => {
    if (personId === this.snapshot.personId) return;
    void this.go({ kind: 'home' }, personId, 'auto');
  };

  readonly reportScroll = (entryId: string, y: number): void => {
    this.dispatch({ type: 'saveScroll', entryId, y });
  };

  readonly retry = (): void => {
    const { failure } = this.snapshot;
    if (failure)
      void this.go(failure.route, failure.ownerId, failure.historyMode);
  };

  readonly dismissFailure = (): void => {
    this.update({ failure: null });
  };

  private async boot(): Promise<void> {
    let people: Person[];
    try {
      people = await this.environment.api.listPeople();
    } catch {
      this.update({ status: 'offline' });
      return;
    }

    const first = people[0];
    if (!first) {
      this.update({ status: 'offline' });
      return;
    }

    const known = new Set(people.map((person) => person.id));
    const stored = this.environment.storage.load();
    const storedOwner = stored && currentEntry(stored)?.ownerId;
    const usable = storedOwner && known.has(storedOwner) ? stored : null;
    const trail = usable ?? EMPTY_TRAIL;

    this.update({ people, trail, status: 'ready' });

    // A browser entry the trail knows means this was a refresh: carry on from there.
    const entryId = this.environment.history.currentEntryId();
    if (entryId && trail.entries.some((entry) => entry.id === entryId)) {
      this.dispatch({ type: 'traverse', entryId });
      return;
    }

    // Otherwise this tab just arrived at a URL, and the browser already has its entry.
    const ownerId = currentEntry(trail)?.ownerId ?? first.id;
    await this.go(this.routeFromUrl(), ownerId, 'replace');
  }

  private readonly handleBrowserMove = (entryId: string | null): void => {
    this.traversing = false;
    this.inflight?.abort();
    this.update({ failure: null });

    const known = this.snapshot.trail.entries.some(
      (entry) => entry.id === entryId,
    );
    if (entryId !== null && known) {
      this.dispatch({ type: 'traverse', entryId });
      return;
    }

    // An entry the trail has dropped, or never knew: treat it as arriving at its URL.
    const ownerId = this.snapshot.personId;
    if (ownerId !== null) void this.go(this.routeFromUrl(), ownerId, 'replace');
  };

  private routeFromUrl(): Route {
    const { pathname, search } = this.environment.history.location();
    return decodeRoute(pathname, search) ?? { kind: 'home' };
  }

  private async go(
    route: Route,
    ownerId: string,
    historyMode: HistoryMode,
  ): Promise<void> {
    this.inflight?.abort();
    const controller = new AbortController();
    this.inflight = controller;

    const requestId = this.environment.createId();
    this.update({ failure: null });
    this.dispatch({ type: 'begin', requestId, route });

    let location: TrailLocation;
    try {
      location = await this.locate(route, controller.signal);
    } catch {
      if (this.snapshot.trail.pending?.requestId !== requestId) return;
      this.dispatch({ type: 'fail', requestId });
      this.update({ failure: { route, ownerId, historyMode } });
      return;
    }

    // Something newer has taken over while this one was on its way.
    if (this.snapshot.trail.pending?.requestId !== requestId) return;

    const entry = { id: this.environment.createId(), ownerId, location };
    const mode = commitMode(this.snapshot.trail, entry);
    this.dispatch({ type: 'commit', requestId, entry });

    const url = encodeRoute(routeOf(location));
    if (historyMode === 'replace' || mode === 'replace') {
      this.environment.history.replace(entry.id, url);
    } else {
      this.environment.history.push(entry.id, url);
    }
  }

  private async locate(
    route: Route,
    signal: AbortSignal,
  ): Promise<TrailLocation> {
    if (route.kind !== 'address') return route;

    const site = await this.environment.api.resolveAddress(
      route.address,
      signal,
    );
    return site
      ? { kind: 'site', ...site }
      : { kind: 'nowhere', address: route.address };
  }

  private dispatch(action: TrailAction): void {
    const previous = this.snapshot.trail;
    const trail = trailReducer(previous, action);
    if (trail === previous) return;

    const owner = currentEntry(trail)?.ownerId;
    this.update({ trail, ...(owner ? { personId: owner } : {}) });

    if (trail.entries !== previous.entries || trail.index !== previous.index) {
      this.environment.storage.save(trail);
    }
  }

  private update(changes: Partial<NavigatorSnapshot>): void {
    const next = { ...this.snapshot, ...changes };
    if (next.status === 'ready' && next.personId === null) {
      const owner = currentEntry(next.trail)?.ownerId ?? next.people[0]?.id;
      this.snapshot = { ...next, personId: owner ?? null };
    } else {
      this.snapshot = next;
    }
    for (const listener of this.listeners) listener();
  }
}
