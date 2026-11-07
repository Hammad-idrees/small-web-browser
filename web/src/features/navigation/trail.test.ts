import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  commitMode,
  currentEntry,
  EMPTY_TRAIL,
  entryAhead,
  entryBehind,
  MAX_ENTRIES,
  routeOf,
  type Trail,
  type TrailLocation,
  trailReducer,
} from './trail';

const NOOR = 'noor';
const MARA = 'mara';

const site = (address: string, versionId = `${address}-v1`): TrailLocation => ({
  kind: 'site',
  address,
  versionId,
  title: address,
  authorName: 'An Author',
});

let nextId = 0;

/** Asks for a location and shows it, as a successful navigation would. */
function go(
  trail: Trail,
  location: TrailLocation,
  ownerId = NOOR,
  id = `entry-${(nextId += 1)}`,
): Trail {
  const requestId = `request-${id}`;
  const begun = trailReducer(trail, {
    type: 'begin',
    requestId,
    route: routeOf(location),
  });
  return trailReducer(begun, {
    type: 'commit',
    requestId,
    entry: { id, ownerId, location },
  });
}

function walk(...addresses: string[]): Trail {
  return addresses.reduce(
    (trail, address) => go(trail, site(address)),
    EMPTY_TRAIL,
  );
}

function back(trail: Trail): Trail {
  const entry = entryBehind(trail);
  if (!entry) throw new Error('Nothing behind');
  return trailReducer(trail, { type: 'traverse', entryId: entry.id });
}

function forward(trail: Trail): Trail {
  const entry = entryAhead(trail);
  if (!entry) throw new Error('Nothing ahead');
  return trailReducer(trail, { type: 'traverse', entryId: entry.id });
}

const here = (trail: Trail) => {
  const location = currentEntry(trail)?.location;
  return location && 'address' in location ? location.address : location?.kind;
};

const addresses = (trail: Trail) =>
  trail.entries.map((entry) =>
    'address' in entry.location ? entry.location.address : entry.location.kind,
  );

describe('an empty trail', () => {
  it('has nowhere to be and nowhere to go', () => {
    expect(currentEntry(EMPTY_TRAIL)).toBeNull();
    expect(entryBehind(EMPTY_TRAIL)).toBeNull();
    expect(entryAhead(EMPTY_TRAIL)).toBeNull();
  });
});

describe('going somewhere new', () => {
  it('adds a step and moves to it', () => {
    const trail = walk('a.zz', 'b.zz');
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz']);
    expect(here(trail)).toBe('b.zz');
  });

  it('starts each new page at the top', () => {
    expect(currentEntry(walk('a.zz'))?.scrollY).toBe(0);
  });

  it('has nothing behind the first page', () => {
    expect(entryBehind(walk('a.zz'))).toBeNull();
  });
});

describe('back and forward', () => {
  it('walks a trail four deep, all the way back and all the way forward', () => {
    let trail = walk('a.zz', 'b.zz', 'c.zz', 'd.zz');

    trail = back(trail);
    expect(here(trail)).toBe('c.zz');
    trail = back(trail);
    expect(here(trail)).toBe('b.zz');
    trail = back(trail);
    expect(here(trail)).toBe('a.zz');
    expect(entryBehind(trail)).toBeNull();

    trail = forward(trail);
    expect(here(trail)).toBe('b.zz');
    trail = forward(trail);
    expect(here(trail)).toBe('c.zz');
    trail = forward(trail);
    expect(here(trail)).toBe('d.zz');
    expect(entryAhead(trail)).toBeNull();
  });

  it('does not change the steps themselves', () => {
    const trail = walk('a.zz', 'b.zz', 'c.zz');
    expect(back(back(trail)).entries).toBe(trail.entries);
  });

  it('can jump several steps at once, as the browser allows', () => {
    const trail = walk('a.zz', 'b.zz', 'c.zz');
    const first = trail.entries[0]?.id ?? '';
    const moved = trailReducer(trail, { type: 'traverse', entryId: first });
    expect(here(moved)).toBe('a.zz');
    expect(entryAhead(moved)?.location).toEqual(site('b.zz'));
  });

  it('ignores an entry it does not know', () => {
    const trail = walk('a.zz');
    expect(trailReducer(trail, { type: 'traverse', entryId: 'gone' })).toBe(
      trail,
    );
  });

  it('does nothing when already at that entry', () => {
    const trail = walk('a.zz');
    const id = currentEntry(trail)?.id ?? '';
    expect(trailReducer(trail, { type: 'traverse', entryId: id })).toBe(trail);
  });
});

describe('losing forward', () => {
  it('loses everything ahead when going somewhere new after going back', () => {
    const trail = go(
      back(back(walk('a.zz', 'b.zz', 'c.zz', 'd.zz'))),
      site('x.zz'),
    );
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz', 'x.zz']);
    expect(entryAhead(trail)).toBeNull();
  });

  it('keeps everything behind', () => {
    const trail = go(back(walk('a.zz', 'b.zz', 'c.zz')), site('x.zz'));
    expect(here(back(trail))).toBe('b.zz');
    expect(here(back(back(trail)))).toBe('a.zz');
  });

  it('does not come back, even by revisiting the same page', () => {
    const trail = go(back(walk('a.zz', 'b.zz', 'c.zz')), site('c.zz'));
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz', 'c.zz']);
    expect(entryAhead(trail)).toBeNull();
  });

  it('keeps forward while only moving back and forward', () => {
    const trail = forward(back(back(walk('a.zz', 'b.zz', 'c.zz'))));
    expect(entryAhead(trail)?.location).toEqual(site('c.zz'));
  });
});

describe('going again to the page you are on', () => {
  it('replaces the current step instead of adding one', () => {
    const trail = go(walk('a.zz', 'b.zz'), site('b.zz'));
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz']);
    expect(trail.index).toBe(1);
  });

  it('keeps forward, as a reload would', () => {
    const trail = go(back(walk('a.zz', 'b.zz')), site('a.zz'));
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz']);
    expect(entryAhead(trail)?.location).toEqual(site('b.zz'));
  });

  it('picks up the newest version and returns to the top', () => {
    let trail = walk('a.zz');
    const id = currentEntry(trail)?.id ?? '';
    trail = trailReducer(trail, { type: 'saveScroll', entryId: id, y: 500 });
    trail = go(trail, site('a.zz', 'a.zz-v2'));

    expect(currentEntry(trail)?.location).toEqual(site('a.zz', 'a.zz-v2'));
    expect(currentEntry(trail)?.scrollY).toBe(0);
  });

  it('treats an address that now has a page as the same place', () => {
    const nowhere: TrailLocation = { kind: 'nowhere', address: 'a.zz' };
    const trail = go(go(EMPTY_TRAIL, nowhere), site('a.zz'));
    expect(trail.entries).toHaveLength(1);
    expect(currentEntry(trail)?.location.kind).toBe('site');
  });

  it('says which it will do, so the browser history can do the same', () => {
    const trail = walk('a.zz');
    const same = { ownerId: NOOR, location: site('a.zz') };
    const other = { ownerId: NOOR, location: site('b.zz') };
    expect(commitMode(trail, same)).toBe('replace');
    expect(commitMode(trail, other)).toBe('push');
    expect(commitMode(EMPTY_TRAIL, same)).toBe('push');
  });

  it('treats a different search as somewhere new', () => {
    const search = (query: string): TrailLocation => ({
      kind: 'search',
      query,
    });
    const trail = go(go(EMPTY_TRAIL, search('tide')), search('moss'));
    expect(trail.entries).toHaveLength(2);
  });
});

describe('restoring on return', () => {
  it('remembers where each page was scrolled to', () => {
    let trail = walk('a.zz', 'b.zz');
    const [a, b] = trail.entries;
    trail = trailReducer(trail, {
      type: 'saveScroll',
      entryId: a?.id ?? '',
      y: 300,
    });
    trail = trailReducer(trail, {
      type: 'saveScroll',
      entryId: b?.id ?? '',
      y: 700,
    });

    expect(currentEntry(trail)?.scrollY).toBe(700);
    expect(currentEntry(back(trail))?.scrollY).toBe(300);
    expect(currentEntry(forward(back(trail)))?.scrollY).toBe(700);
  });

  it('returns to the version that was left, even if a newer one was seen', () => {
    let trail = go(EMPTY_TRAIL, site('a.zz', 'a.zz-v1'));
    trail = go(trail, site('b.zz'));
    trail = go(trail, site('a.zz', 'a.zz-v2'));

    const middle = back(trail);
    const first = back(middle);
    expect(currentEntry(first)?.location).toEqual(site('a.zz', 'a.zz-v1'));
    expect(currentEntry(trail)?.location).toEqual(site('a.zz', 'a.zz-v2'));
  });

  it('remembers a search and how far down its results were read', () => {
    const search: TrailLocation = { kind: 'search', query: 'lighthouse' };
    let trail = go(EMPTY_TRAIL, search);
    const id = currentEntry(trail)?.id ?? '';
    trail = trailReducer(trail, { type: 'saveScroll', entryId: id, y: 450 });
    trail = go(trail, site('harbourlight.zz'));

    const returned = currentEntry(back(trail));
    expect(returned?.location).toEqual(search);
    expect(returned?.scrollY).toBe(450);
  });

  it('keeps a dead address as a real step', () => {
    const trail = go(walk('a.zz'), { kind: 'nowhere', address: 'dead.zz' });
    expect(here(trail)).toBe('dead.zz');
    expect(here(back(trail))).toBe('a.zz');
    expect(here(forward(back(trail)))).toBe('dead.zz');
  });

  it.each([
    ['negative', -1],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('ignores a scroll position that is %s', (_name, y) => {
    const trail = walk('a.zz');
    const id = currentEntry(trail)?.id ?? '';
    expect(trailReducer(trail, { type: 'saveScroll', entryId: id, y })).toBe(
      trail,
    );
  });

  it('ignores a scroll report for an entry that is gone', () => {
    const trail = walk('a.zz');
    expect(
      trailReducer(trail, { type: 'saveScroll', entryId: 'gone', y: 10 }),
    ).toBe(trail);
  });

  it('does not change anything when the position is the same', () => {
    let trail = walk('a.zz');
    const id = currentEntry(trail)?.id ?? '';
    trail = trailReducer(trail, { type: 'saveScroll', entryId: id, y: 10 });
    expect(
      trailReducer(trail, { type: 'saveScroll', entryId: id, y: 10 }),
    ).toBe(trail);
  });
});

describe('navigations in flight', () => {
  const request = (trail: Trail, requestId: string, address: string) =>
    trailReducer(trail, {
      type: 'begin',
      requestId,
      route: { kind: 'address', address },
    });

  const respond = (trail: Trail, requestId: string, address: string) =>
    trailReducer(trail, {
      type: 'commit',
      requestId,
      entry: { id: requestId, ownerId: NOOR, location: site(address) },
    });

  it('changes nothing shown until the page has arrived', () => {
    const trail = request(walk('a.zz'), 'r1', 'b.zz');
    expect(here(trail)).toBe('a.zz');
    expect(trail.entries).toHaveLength(1);
    expect(trail.pending?.route).toEqual({ kind: 'address', address: 'b.zz' });
  });

  it('clears the pending request when the page arrives', () => {
    const trail = respond(request(walk('a.zz'), 'r1', 'b.zz'), 'r1', 'b.zz');
    expect(trail.pending).toBeNull();
    expect(here(trail)).toBe('b.zz');
  });

  it('lets a second request beat a slow first one', () => {
    let trail = request(walk('a.zz'), 'slow', 'slow.zz');
    trail = request(trail, 'fast', 'fast.zz');

    trail = respond(trail, 'fast', 'fast.zz');
    expect(here(trail)).toBe('fast.zz');

    trail = respond(trail, 'slow', 'slow.zz');
    expect(here(trail)).toBe('fast.zz');
    expect(addresses(trail)).toEqual(['a.zz', 'fast.zz']);
  });

  it('ignores a slow response that arrives before the newer one', () => {
    let trail = request(walk('a.zz'), 'slow', 'slow.zz');
    trail = request(trail, 'fast', 'fast.zz');

    trail = respond(trail, 'slow', 'slow.zz');
    expect(here(trail)).toBe('a.zz');
    expect(trail.pending?.requestId).toBe('fast');

    trail = respond(trail, 'fast', 'fast.zz');
    expect(here(trail)).toBe('fast.zz');
  });

  it('abandons the request when the person moves back', () => {
    let trail = request(walk('a.zz', 'b.zz'), 'r1', 'c.zz');
    trail = back(trail);
    expect(trail.pending).toBeNull();

    trail = respond(trail, 'r1', 'c.zz');
    expect(here(trail)).toBe('a.zz');
    expect(entryAhead(trail)?.location).toEqual(site('b.zz'));
  });

  it('abandons the request when the person jumps to the entry they are on', () => {
    const trail = request(walk('a.zz'), 'r1', 'b.zz');
    const id = currentEntry(trail)?.id ?? '';
    expect(
      trailReducer(trail, { type: 'traverse', entryId: id }).pending,
    ).toBeNull();
  });

  it('stays where it was when a request fails', () => {
    const before = walk('a.zz', 'b.zz');
    const trail = trailReducer(request(before, 'r1', 'c.zz'), {
      type: 'fail',
      requestId: 'r1',
    });
    expect(trail.pending).toBeNull();
    expect(addresses(trail)).toEqual(['a.zz', 'b.zz']);
    expect(here(trail)).toBe('b.zz');
  });

  it('keeps forward when a request fails', () => {
    const trail = trailReducer(
      request(back(walk('a.zz', 'b.zz')), 'r1', 'c.zz'),
      {
        type: 'fail',
        requestId: 'r1',
      },
    );
    expect(entryAhead(trail)?.location).toEqual(site('b.zz'));
  });

  it('ignores the failure of a request that is no longer the latest', () => {
    let trail = request(walk('a.zz'), 'old', 'old.zz');
    trail = request(trail, 'new', 'new.zz');
    trail = trailReducer(trail, { type: 'fail', requestId: 'old' });
    expect(trail.pending?.requestId).toBe('new');
  });

  it('ignores a response when nothing was asked for', () => {
    const trail = walk('a.zz');
    expect(respond(trail, 'unknown', 'b.zz')).toBe(trail);
  });

  it('cannot apply the same response twice', () => {
    const once = respond(request(walk('a.zz'), 'r1', 'b.zz'), 'r1', 'b.zz');
    expect(respond(once, 'r1', 'b.zz')).toBe(once);
  });
});

describe('when the trail changes hands', () => {
  const switched = () => go(walk('a.zz', 'b.zz'), { kind: 'home' }, MARA);

  it('stops Back at the start of the new person', () => {
    expect(entryBehind(switched())).toBeNull();
  });

  it('stops Forward at the end of the earlier person', () => {
    const trail = switched();
    const earlier = trail.entries[1]?.id ?? '';
    const returned = trailReducer(trail, {
      type: 'traverse',
      entryId: earlier,
    });
    expect(entryAhead(returned)).toBeNull();
    expect(entryBehind(returned)?.location).toEqual(site('a.zz'));
  });

  it('restores who was browsing when the real Back crosses the boundary', () => {
    const trail = switched();
    expect(currentEntry(trail)?.ownerId).toBe(MARA);
    const earlier = trail.entries[1]?.id ?? '';
    const returned = trailReducer(trail, {
      type: 'traverse',
      entryId: earlier,
    });
    expect(currentEntry(returned)?.ownerId).toBe(NOOR);
  });

  it('treats the same page, for a different person, as a new step', () => {
    const trail = go(walk('a.zz'), site('a.zz'), MARA);
    expect(trail.entries).toHaveLength(2);
  });
});

describe('a very long session', () => {
  it('drops the oldest steps, keeping its position valid', () => {
    const many = Array.from({ length: MAX_ENTRIES + 25 }, (_, i) => `s${i}.zz`);
    const trail = walk(...many);

    expect(trail.entries).toHaveLength(MAX_ENTRIES);
    expect(trail.index).toBe(MAX_ENTRIES - 1);
    expect(here(trail)).toBe(`s${MAX_ENTRIES + 24}.zz`);
    expect(here(back(trail))).toBe(`s${MAX_ENTRIES + 23}.zz`);
  });
});

describe('any sequence of actions', () => {
  /** A small seeded generator, so a failure here can always be reproduced. */
  function randomizer(seed: number) {
    let state = seed;
    return (limit: number) => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return Math.floor((state / 4294967296) * limit);
    };
  }

  /** The simplest correct browser: a list and a position, with no other rules. */
  interface Model {
    stack: string[];
    position: number;
  }

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'matches a simple model of a browser (seed %i)',
    (seed) => {
      const random = randomizer(seed);
      let trail = EMPTY_TRAIL;
      const model: Model = { stack: [], position: -1 };

      for (let step = 0; step < 500; step += 1) {
        const choice = random(10);

        if (choice < 5) {
          const address = `s${random(6)}.zz`;
          trail = go(trail, site(address));
          if (model.stack[model.position] !== address) {
            model.stack = model.stack.slice(0, model.position + 1);
            model.stack.push(address);
            model.stack = model.stack.slice(-MAX_ENTRIES);
            model.position = model.stack.length - 1;
          }
        } else if (choice < 8 && model.position > 0) {
          trail = back(trail);
          model.position -= 1;
        } else if (choice >= 8 && model.position < model.stack.length - 1) {
          trail = forward(trail);
          model.position += 1;
        }

        expect(addresses(trail)).toEqual(model.stack);
        expect(here(trail)).toBe(model.stack[model.position]);

        const ids = trail.entries.map((entry) => entry.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(trail.index).toBeGreaterThanOrEqual(0);
        expect(trail.index).toBeLessThan(trail.entries.length);
      }
    },
  );

  it('never changes the trail it was given', () => {
    const trail = walk('a.zz', 'b.zz');
    const frozen = JSON.stringify(trail);
    go(trail, site('c.zz'));
    back(trail);
    trailReducer(trail, {
      type: 'saveScroll',
      entryId: trail.entries[0]?.id ?? '',
      y: 5,
    });
    expect(JSON.stringify(trail)).toBe(frozen);
  });
});

describe('purity', () => {
  it('has no dependency on React, the browser or the clock', () => {
    const source = readFileSync(new URL('./trail.ts', import.meta.url), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    for (const forbidden of [
      /from 'react'/,
      /from 'next/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\bhistory\b\./,
      /\bsessionStorage\b/,
      /Date\.now/,
      /new Date/,
      /Math\.random/,
      /crypto/,
    ]) {
      expect(code).not.toMatch(forbidden);
    }
  });
});
