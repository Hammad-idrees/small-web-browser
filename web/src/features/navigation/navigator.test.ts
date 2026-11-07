import type { Person, RecordVisit, SiteSummary } from '@small-web/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Navigator, type NavigatorEnvironment } from './navigator';
import type { Route } from './route-codec';
import { currentEntry, entryAhead, entryBehind, type Trail } from './trail';

const NOOR: Person = { id: 'a'.repeat(24), name: 'David Miller' };
const MARA: Person = { id: 'b'.repeat(24), name: 'Sarah Jones' };
const REAL_SITES = ['a.zz', 'b.zz', 'c.zz', 'd.zz', 'slow.zz', 'fast.zz'];

const site = (address: string): SiteSummary => ({
  address,
  title: `Title of ${address}`,
  authorName: 'An Author',
  versionId: `${address}-v1`,
});

/** Behaves like a browser's history: a list and a position, shared by every button. */
class FakeHistory {
  stack: { entryId: string | null; url: string }[];
  position = 0;
  private listener: ((entryId: string | null) => void) | null = null;

  constructor(url = '/') {
    this.stack = [{ entryId: null, url }];
  }

  currentEntryId = () => this.stack[this.position]?.entryId ?? null;

  location = () => {
    const url = new URL(
      this.stack[this.position]?.url ?? '/',
      'http://app.test',
    );
    return { pathname: url.pathname, search: url.search };
  };

  push = (entryId: string, url: string) => {
    this.stack = this.stack.slice(0, this.position + 1);
    this.stack.push({ entryId, url });
    this.position = this.stack.length - 1;
  };

  replace = (entryId: string, url: string) => {
    this.stack[this.position] = { entryId, url };
  };

  back = () => this.move(-1);
  forward = () => this.move(1);

  /** What the browser's own buttons do. */
  move(delta: number) {
    const next = this.position + delta;
    if (next < 0 || next >= this.stack.length) return;
    this.position = next;
    this.listener?.(this.currentEntryId());
  }

  listen = (listener: (entryId: string | null) => void) => {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  };

  urls = () => this.stack.map((entry) => entry.url);
  url = () => this.stack[this.position]?.url;
}

interface Deferred {
  address: string;
  signal: AbortSignal;
  resolve: (value: SiteSummary | null) => void;
  reject: (reason: Error) => void;
}

function setup(
  options: {
    history?: FakeHistory;
    stored?: { value: Trail | null };
    people?: Person[];
    manual?: boolean;
  } = {},
) {
  const history = options.history ?? new FakeHistory();
  const stored = options.stored ?? { value: null };
  const requests: Deferred[] = [];
  let peopleFails = false;
  let addressFails = false;
  let recordFails = false;
  const recorded: (RecordVisit & { entryId: string })[] = [];
  let id = 0;

  const environment: NavigatorEnvironment = {
    history,
    storage: {
      load: () => stored.value,
      save: (trail) => {
        stored.value = trail;
      },
    },
    api: {
      listPeople: () =>
        peopleFails
          ? Promise.reject(new Error('down'))
          : Promise.resolve(options.people ?? [NOOR, MARA]),
      resolveAddress: (address, signal) => {
        if (addressFails) return Promise.reject(new Error('down'));
        if (options.manual) {
          return new Promise((resolve, reject) => {
            requests.push({ address, signal, resolve, reject });
          });
        }
        return Promise.resolve(
          REAL_SITES.includes(address) ? site(address) : null,
        );
      },
      recordVisit: (entryId, visit) => {
        if (recordFails) return Promise.reject(new Error('down'));
        recorded.push({ entryId, ...visit });
        return Promise.resolve();
      },
    },
    createId: () => `id-${(id += 1)}`,
  };

  const navigator = new Navigator(environment);
  return {
    navigator,
    history,
    stored,
    requests,
    recorded,
    snapshot: () => navigator.getSnapshot(),
    failRecording: (value: boolean) => {
      recordFails = value;
    },
    failPeople: (value: boolean) => {
      peopleFails = value;
    },
    failAddresses: (value: boolean) => {
      addressFails = value;
    },
  };
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const to = (address: string): Route => ({ kind: 'address', address });

async function visit(
  navigator: Navigator,
  ...addresses: string[]
): Promise<void> {
  for (const address of addresses) {
    navigator.navigate(to(address));
    await settle();
  }
}

const here = (trail: Trail) => {
  const location = currentEntry(trail)?.location;
  return location && 'address' in location ? location.address : location?.kind;
};

describe('Navigator', () => {
  let world: ReturnType<typeof setup>;

  beforeEach(async () => {
    world = setup();
    world.navigator.connect();
    await settle();
  });

  describe('starting up', () => {
    it('goes from booting to ready, as the first person, at home', () => {
      expect(world.snapshot().status).toBe('ready');
      expect(world.snapshot().personId).toBe(NOOR.id);
      expect(here(world.snapshot().trail)).toBe('home');
    });

    it('uses the entry the browser already has, without adding one', () => {
      expect(world.history.stack).toHaveLength(1);
      expect(world.history.currentEntryId()).toBe(
        currentEntry(world.snapshot().trail)?.id,
      );
    });

    it('arrives at the address in the URL', async () => {
      const opened = setup({ history: new FakeHistory('/site/b.zz') });
      opened.navigator.connect();
      await settle();
      expect(here(opened.snapshot().trail)).toBe('b.zz');
      expect(opened.history.stack).toHaveLength(1);
    });

    it('goes home from a URL that means nothing', async () => {
      const opened = setup({ history: new FakeHistory('/nope') });
      opened.navigator.connect();
      await settle();
      expect(here(opened.snapshot().trail)).toBe('home');
      expect(opened.history.url()).toBe('/');
    });

    it('reports being offline, and can try again', async () => {
      const opened = setup();
      opened.failPeople(true);
      opened.navigator.connect();
      await settle();
      expect(opened.snapshot().status).toBe('offline');

      opened.failPeople(false);
      opened.navigator.retryBoot();
      await settle();
      expect(opened.snapshot().status).toBe('ready');
    });

    it('is offline when there is nobody to browse as', async () => {
      const opened = setup({ people: [] });
      opened.navigator.connect();
      await settle();
      expect(opened.snapshot().status).toBe('offline');
    });

    it('boots only once when connected twice, as React may do', async () => {
      const opened = setup();
      const stop = opened.navigator.connect();
      stop();
      opened.navigator.connect();
      await settle();
      expect(opened.snapshot().trail.entries).toHaveLength(1);
    });
  });

  describe('going places', () => {
    it('adds a browser entry with a real URL for each new page', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz');
      expect(world.history.urls()).toEqual(['/', '/site/a.zz', '/site/b.zz']);
      expect(here(world.snapshot().trail)).toBe('b.zz');
    });

    it('pins the exact version that was shown', async () => {
      await visit(world.navigator, 'a.zz');
      expect(currentEntry(world.snapshot().trail)?.location).toMatchObject({
        kind: 'site',
        versionId: 'a.zz-v1',
      });
    });

    it('treats an address with nothing there as a real step', async () => {
      await visit(world.navigator, 'a.zz', 'dead.zz');
      const location = currentEntry(world.snapshot().trail)?.location;
      expect(location).toEqual({ kind: 'nowhere', address: 'dead.zz' });
      expect(world.history.url()).toBe('/site/dead.zz');

      world.navigator.goBack();
      expect(here(world.snapshot().trail)).toBe('a.zz');
    });

    it('replaces the browser entry when going to the page you are on', async () => {
      await visit(world.navigator, 'a.zz', 'a.zz');
      expect(world.history.urls()).toEqual(['/', '/site/a.zz']);
      expect(world.snapshot().trail.entries).toHaveLength(2);
    });
  });

  describe('back and forward', () => {
    it('moves along the trail, from the app buttons', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');

      world.navigator.goBack();
      expect(here(world.snapshot().trail)).toBe('b.zz');
      world.navigator.goBack();
      expect(here(world.snapshot().trail)).toBe('a.zz');
      world.navigator.goForward();
      expect(here(world.snapshot().trail)).toBe('b.zz');
    });

    it('moves along the trail, from the real browser buttons', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz');

      world.history.move(-1);
      expect(here(world.snapshot().trail)).toBe('a.zz');
      world.history.move(1);
      expect(here(world.snapshot().trail)).toBe('b.zz');
    });

    it('agrees with the browser after any mix of the two', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz', 'd.zz');

      world.navigator.goBack();
      world.history.move(-1);
      world.navigator.goBack();
      world.history.move(1);
      world.navigator.goForward();

      expect(currentEntry(world.snapshot().trail)?.id).toBe(
        world.history.currentEntryId(),
      );
      expect(world.history.url()).toBe('/site/c.zz');
    });

    it('jumps several steps when the browser does', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');
      world.history.move(-3);
      expect(here(world.snapshot().trail)).toBe('home');
    });

    it('loses forward in the trail and the browser together', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');
      world.navigator.goBack();
      world.navigator.goBack();
      await visit(world.navigator, 'd.zz');

      expect(world.history.urls()).toEqual(['/', '/site/a.zz', '/site/d.zz']);
      expect(entryAhead(world.snapshot().trail)).toBeNull();
      expect(here(world.snapshot().trail)).toBe('d.zz');
    });

    it('does not try to go where there is nothing', () => {
      const position = world.history.position;
      world.navigator.goBack();
      world.navigator.goForward();
      expect(world.history.position).toBe(position);
    });

    it('takes a double click on Back as one step while one is on its way', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');
      const slowBack = world.history.back;
      let queued = null as (() => void) | null;
      world.history.back = () => {
        queued = slowBack;
      };

      world.navigator.goBack();
      world.navigator.goBack();
      queued?.();

      expect(here(world.snapshot().trail)).toBe('b.zz');
    });
  });

  describe('restoring', () => {
    it('remembers the scroll position through back and forward', async () => {
      await visit(world.navigator, 'a.zz');
      const a = currentEntry(world.snapshot().trail);
      world.navigator.reportScroll(a?.id ?? '', 420);
      await visit(world.navigator, 'b.zz');

      world.navigator.goBack();
      expect(currentEntry(world.snapshot().trail)?.scrollY).toBe(420);
    });

    it('carries on from the same place after a refresh', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');
      world.navigator.goBack();
      const before = world.snapshot().trail;
      world.navigator.reportScroll(currentEntry(before)?.id ?? '', 300);

      const refreshed = setup({ history: world.history, stored: world.stored });
      refreshed.navigator.connect();
      await settle();

      const trail = refreshed.snapshot().trail;
      expect(here(trail)).toBe('b.zz');
      expect(currentEntry(trail)?.scrollY).toBe(300);
      expect(entryAhead(trail)).not.toBeNull();
      expect(entryBehind(trail)).not.toBeNull();
      expect(world.history.stack).toHaveLength(4);
    });

    it('never saves a request in flight', async () => {
      const opened = setup({ manual: true });
      opened.navigator.connect();
      await settle();
      opened.navigator.navigate(to('a.zz'));
      await settle();
      expect(opened.stored.value?.pending ?? null).toBeNull();
    });

    it('survives a stored trail whose owner no longer exists', async () => {
      await visit(world.navigator, 'a.zz');
      const opened = setup({
        history: new FakeHistory('/'),
        stored: world.stored,
        people: [MARA],
      });
      opened.navigator.connect();
      await settle();

      expect(opened.snapshot().personId).toBe(MARA.id);
      expect(opened.snapshot().trail.entries).toHaveLength(1);
    });

    it('recovers when the browser returns to an entry the trail dropped', async () => {
      world.history.stack.splice(0, 0, {
        entryId: 'long-gone',
        url: '/site/b.zz',
      });
      world.history.position += 1;

      world.history.move(-1);
      await settle();

      expect(here(world.snapshot().trail)).toBe('b.zz');
    });
  });

  describe('navigations in flight', () => {
    let slow: ReturnType<typeof setup>;

    beforeEach(async () => {
      slow = setup({ manual: true });
      slow.navigator.connect();
      await settle();
    });

    const answer = (index: number, address: string) => {
      slow.requests[index]?.resolve(site(address));
      return settle();
    };

    it('shows what is loading without moving there', async () => {
      slow.navigator.navigate(to('a.zz'));
      expect(slow.snapshot().trail.pending?.route).toEqual(to('a.zz'));
      expect(here(slow.snapshot().trail)).toBe('home');
      expect(slow.history.stack).toHaveLength(1);

      await answer(0, 'a.zz');
      expect(slow.snapshot().trail.pending).toBeNull();
      expect(here(slow.snapshot().trail)).toBe('a.zz');
    });

    it('lets a second navigation beat a slow first one', async () => {
      slow.navigator.navigate(to('slow.zz'));
      slow.navigator.navigate(to('fast.zz'));
      expect(slow.requests[0]?.signal.aborted).toBe(true);

      await answer(1, 'fast.zz');
      await answer(0, 'slow.zz');

      expect(here(slow.snapshot().trail)).toBe('fast.zz');
      expect(slow.history.urls()).toEqual(['/', '/site/fast.zz']);
    });

    it('abandons a request when the person goes back', async () => {
      slow.navigator.navigate(to('a.zz'));
      await answer(0, 'a.zz');

      slow.navigator.navigate(to('b.zz'));
      slow.navigator.goBack();
      expect(slow.requests[1]?.signal.aborted).toBe(true);

      await answer(1, 'b.zz');
      expect(here(slow.snapshot().trail)).toBe('home');
      expect(entryAhead(slow.snapshot().trail)).not.toBeNull();
    });
  });

  describe('when the API cannot be reached', () => {
    it('stays where it was, and says so', async () => {
      await visit(world.navigator, 'a.zz');
      world.failAddresses(true);
      await visit(world.navigator, 'b.zz');

      expect(here(world.snapshot().trail)).toBe('a.zz');
      expect(world.history.url()).toBe('/site/a.zz');
      expect(world.snapshot().failure?.route).toEqual(to('b.zz'));
      expect(world.snapshot().trail.pending).toBeNull();
    });

    it('can retry the same navigation', async () => {
      world.failAddresses(true);
      await visit(world.navigator, 'b.zz');

      world.failAddresses(false);
      world.navigator.retry();
      await settle();

      expect(here(world.snapshot().trail)).toBe('b.zz');
      expect(world.snapshot().failure).toBeNull();
    });

    it('can be dismissed', async () => {
      world.failAddresses(true);
      await visit(world.navigator, 'b.zz');
      world.navigator.dismissFailure();
      expect(world.snapshot().failure).toBeNull();
    });

    it('clears the failure when the person moves on', async () => {
      await visit(world.navigator, 'a.zz');
      world.failAddresses(true);
      await visit(world.navigator, 'b.zz');

      world.navigator.goBack();
      expect(world.snapshot().failure).toBeNull();
    });
  });

  describe('recording visits', () => {
    const ways = () => world.recorded.map((v) => [v.via, v.address]);

    it('records each arrival at an address, once, with how it happened', async () => {
      world.navigator.navigate(to('a.zz'), 'typed');
      await settle();
      world.navigator.navigate(to('b.zz'), 'link');
      await settle();
      world.navigator.navigate(to('c.zz'), 'history');
      await settle();

      expect(ways()).toEqual([
        ['typed', 'a.zz'],
        ['link', 'b.zz'],
        ['history', 'c.zz'],
      ]);
    });

    it('names the visit after the trail entry, so a repeat is the same visit', async () => {
      await visit(world.navigator, 'a.zz');
      expect(world.recorded[0]?.entryId).toBe(
        currentEntry(world.snapshot().trail)?.id,
      );
    });

    it('records who was browsing and the exact version shown', async () => {
      await visit(world.navigator, 'a.zz');
      expect(world.recorded[0]).toMatchObject({
        personId: NOOR.id,
        versionId: 'a.zz-v1',
      });
    });

    it('records an address that led nowhere, with no version', async () => {
      await visit(world.navigator, 'dead.zz');
      expect(world.recorded[0]).toMatchObject({
        address: 'dead.zz',
        versionId: null,
      });
    });

    it('records nothing for moving back and forward', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz', 'c.zz');
      const before = world.recorded.length;

      world.navigator.goBack();
      world.history.move(-1);
      world.navigator.goForward();
      world.history.move(1);
      await settle();

      expect(world.recorded).toHaveLength(before);
    });

    it('records nothing for a refresh', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz');
      const before = world.recorded.length;

      const refreshed = setup({ history: world.history, stored: world.stored });
      refreshed.navigator.connect();
      await settle();

      expect(refreshed.recorded).toHaveLength(0);
      expect(world.recorded).toHaveLength(before);
    });

    it('records arriving at a URL directly', async () => {
      const opened = setup({ history: new FakeHistory('/site/b.zz') });
      opened.navigator.connect();
      await settle();
      expect(opened.recorded.map((v) => v.via)).toEqual(['direct']);
    });

    it('does not record the app’s own pages', async () => {
      world.navigator.navigate({ kind: 'history' });
      await settle();
      world.navigator.navigate({ kind: 'search', query: 'tide' });
      await settle();
      world.navigator.switchPerson(MARA.id);
      await settle();
      expect(world.recorded).toHaveLength(0);
    });

    it('records going again to the page you are on, as a new arrival', async () => {
      await visit(world.navigator, 'a.zz', 'a.zz');
      expect(world.recorded).toHaveLength(2);
      expect(world.snapshot().trail.entries).toHaveLength(2);
    });

    it('records nothing for a navigation that failed or was overtaken', async () => {
      world.failAddresses(true);
      await visit(world.navigator, 'a.zz');
      expect(world.recorded).toHaveLength(0);

      const slow = setup({ manual: true });
      slow.navigator.connect();
      await settle();
      slow.navigator.navigate(to('slow.zz'));
      slow.navigator.navigate(to('fast.zz'));
      slow.requests[1]?.resolve(site('fast.zz'));
      slow.requests[0]?.resolve(site('slow.zz'));
      await settle();
      expect(slow.recorded.map((v) => v.address)).toEqual(['fast.zz']);
    });

    it('records how a retried navigation was first asked for', async () => {
      world.failAddresses(true);
      world.navigator.navigate(to('a.zz'), 'link');
      await settle();
      world.failAddresses(false);
      world.navigator.retry();
      await settle();
      expect(ways()).toEqual([['link', 'a.zz']]);
    });

    it('carries on browsing when the history cannot be written', async () => {
      world.failRecording(true);
      await visit(world.navigator, 'a.zz', 'b.zz');
      expect(here(world.snapshot().trail)).toBe('b.zz');
      expect(world.snapshot().failure).toBeNull();
    });
  });

  describe('switching person', () => {
    it('starts a new trail at home', async () => {
      await visit(world.navigator, 'a.zz', 'b.zz');
      world.navigator.switchPerson(MARA.id);
      await settle();

      expect(world.snapshot().personId).toBe(MARA.id);
      expect(here(world.snapshot().trail)).toBe('home');
      expect(entryBehind(world.snapshot().trail)).toBeNull();
    });

    it('does nothing when it is the same person', async () => {
      await visit(world.navigator, 'a.zz');
      const before = world.snapshot().trail;
      world.navigator.switchPerson(NOOR.id);
      await settle();
      expect(world.snapshot().trail).toBe(before);
    });

    it('gives the page back to whoever was browsing on the real Back', async () => {
      await visit(world.navigator, 'a.zz');
      world.navigator.switchPerson(MARA.id);
      await settle();

      world.history.move(-1);

      expect(world.snapshot().personId).toBe(NOOR.id);
      expect(here(world.snapshot().trail)).toBe('a.zz');
    });
  });
});
