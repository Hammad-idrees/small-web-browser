import { normalizeAddress } from '@small-web/contracts';
import { Parser } from 'htmlparser2';
import type { Types } from 'mongoose';
import { buildSeed, SEED_HOUR_START } from './build-seed.js';
import { PEOPLE } from './data/people.js';
import { DEAD_ADDRESSES, HOSTILE_ADDRESS, SITES } from './data/sites.js';
import { DEMO_WALK, TRAILS } from './data/trails.js';

/** Every address a page links to, in canonical form. */
function linksFrom(html: string): string[] {
  const links: string[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      const href = attributes.href;
      if (name !== 'a' || href === undefined) return;
      const address = normalizeAddress(href);
      if (address !== null) links.push(address);
    },
  });
  parser.write(html);
  parser.end();
  return links;
}

const seed = buildSeed();
const addresses = new Set(SITES.map((site) => site.address));
const proseSites = SITES.filter((site) => site.address !== HOSTILE_ADDRESS);
const graph = new Map(
  SITES.map((site) => [
    site.address,
    linksFrom(site.html).filter((link) => addresses.has(link)),
  ]),
);

/** The most pages reachable from `address` by links alone, never turning back. */
function longestWalk(address: string, seen: Set<string>): number {
  const next = (graph.get(address) ?? []).filter((link) => !seen.has(link));
  return (
    1 +
    Math.max(
      0,
      ...next.map((link) => longestWalk(link, new Set([...seen, link]))),
    )
  );
}

describe('seed determinism', () => {
  it('builds byte-identical documents every time', () => {
    expect(JSON.stringify(buildSeed())).toBe(JSON.stringify(seed));
  });

  it('never repeats an id or an address', () => {
    const ids = [
      ...seed.people,
      ...seed.sites,
      ...seed.pageVersions,
      ...seed.visits,
    ].map((doc) => doc._id.toHexString());
    expect(new Set(ids).size).toBe(ids.length);
    expect(addresses.size).toBe(SITES.length);
  });
});

describe('the seeded sites', () => {
  it('has roughly ten sites of prose, plus the hostile one', () => {
    expect(proseSites).toHaveLength(10);
    expect(SITES.map((site) => site.address)).toContain(HOSTILE_ADDRESS);
  });

  it('uses only canonical addresses', () => {
    for (const site of SITES) {
      expect(normalizeAddress(site.address)).toBe(site.address);
    }
  });

  it.each(proseSites.map((site) => [site.address]))(
    '%s has enough prose to read and to scroll',
    (address) => {
      const site = seed.sites.find((entry) => entry.address === address);
      expect(site?.text.split(' ').length).toBeGreaterThan(250);
    },
  );

  it('gives every prose site at least two links to real sites', () => {
    for (const site of proseSites) {
      const real = new Set(graph.get(site.address));
      real.delete(site.address);
      expect(real.size, site.address).toBeGreaterThanOrEqual(2);
    }
  });

  it('lets you wander several steps without turning back', () => {
    for (const site of proseSites) {
      const walk = longestWalk(site.address, new Set([site.address]));
      expect(walk, site.address).toBeGreaterThanOrEqual(6);
    }
  });

  it('links to addresses that never existed, and each one is linked', () => {
    const allLinks = new Set(SITES.flatMap((site) => linksFrom(site.html)));
    for (const dead of DEAD_ADDRESSES) {
      expect(addresses.has(dead), dead).toBe(false);
      expect(allLinks.has(dead), dead).toBe(true);
    }
  });

  it('keeps some links in non-canonical form to exercise normalizing', () => {
    const rawHrefs = SITES.map((site) => site.html).join('');
    expect(rawHrefs).toContain('href="http://saltmarsh.zz/"');
    expect(rawHrefs).toContain('href="HARBOURLIGHT.zz"');
  });
});

describe('the seeded people', () => {
  it('has a handful of people', () => {
    expect(PEOPLE.length).toBeGreaterThanOrEqual(4);
  });

  it('has a couple of authors with more than one site', () => {
    const counts = new Map<string, number>();
    for (const site of SITES) {
      counts.set(site.author, (counts.get(site.author) ?? 0) + 1);
    }
    const prolific = [...counts.values()].filter((count) => count > 1);
    expect(prolific.length).toBeGreaterThanOrEqual(2);
  });
});

describe('the seeded history', () => {
  const personName = (personId: Types.ObjectId) =>
    seed.people.find((person) => person._id.equals(personId))?.name;

  it('falls within one hour, and spans most of it', () => {
    const times = seed.visits.map((visit) => visit.visitedAt.getTime());
    const start = SEED_HOUR_START.getTime();
    const hour = 60 * 60_000;
    expect(Math.min(...times)).toBeGreaterThanOrEqual(start);
    expect(Math.max(...times)).toBeLessThan(start + hour);
    expect(Math.max(...times) - Math.min(...times)).toBeGreaterThan(
      45 * 60_000,
    );
  });

  it('gives every person a history', () => {
    const visitors = new Set(seed.visits.map((v) => personName(v.personId)));
    expect(visitors).toEqual(new Set(PEOPLE));
  });

  it('includes repeat visits', () => {
    const seen = new Set<string>();
    let repeats = 0;
    for (const visit of seed.visits) {
      const key = `${visit.personId.toHexString()}:${visit.address}`;
      if (seen.has(key)) repeats += 1;
      seen.add(key);
    }
    expect(repeats).toBeGreaterThanOrEqual(3);
  });

  it('includes a long trail or two', () => {
    const long = TRAILS.filter((trail) => trail.steps.length >= 5);
    expect(long.length).toBeGreaterThanOrEqual(2);
  });

  it('has someone who has been nearly everywhere', () => {
    const noor = seed.visits.filter(
      (visit) => personName(visit.personId) === 'David Miller' && visit.found,
    );
    const been = new Set(noor.map((visit) => visit.address));
    expect(been.size).toBeGreaterThanOrEqual(proseSites.length);
  });

  it('records dead addresses as not found, with no version', () => {
    const missing = seed.visits.filter((visit) => !visit.found);
    expect(missing.length).toBeGreaterThanOrEqual(3);
    for (const visit of missing) {
      expect(addresses.has(visit.address)).toBe(false);
      expect(visit.versionId).toBeNull();
    }
  });

  it('only records a link visit where the previous page has that link', () => {
    for (const trail of TRAILS) {
      trail.steps.forEach(([via, address], index) => {
        if (via !== 'link') return;
        const previous = trail.steps[index - 1];
        const from = SITES.find((site) => site.address === previous?.[1]);
        expect(from, `${trail.person} -> ${address}`).toBeDefined();
        expect(linksFrom(from?.html ?? '')).toContain(address);
      });
    }
  });
});

describe('the demo walk', () => {
  it('can be walked by following real links', () => {
    DEMO_WALK.trail.slice(1).forEach((address, index) => {
      const from = SITES.find(
        (site) => site.address === DEMO_WALK.trail[index],
      );
      expect(linksFrom(from?.html ?? '')).toContain(address);
    });
    expect(DEMO_WALK.trail.length).toBeGreaterThanOrEqual(4);
  });

  it('ends on a page with a dead link', () => {
    const last = SITES.find((site) => site.address === DEMO_WALK.trail[3]);
    expect(linksFrom(last?.html ?? '')).toContain(DEMO_WALK.deadLink);
    expect(addresses.has(DEMO_WALK.deadLink)).toBe(false);
  });

  it('leaves an address free to publish to', () => {
    expect(addresses.has(DEMO_WALK.freeAddress)).toBe(false);
  });
});

describe('the hostile site', () => {
  const site = SITES.find((entry) => entry.address === HOSTILE_ADDRESS);
  const text = seed.sites.find((entry) => entry.address === HOSTILE_ADDRESS);

  it.each([
    ['script', '<script'],
    ['inline handler', 'onerror='],
    ['javascript URL', 'href="javascript:'],
    ['meta refresh', 'http-equiv="refresh"'],
    ['base rewrite', '<base'],
    ['nested frame', '<iframe'],
    ['form', '<form'],
    ['new window', 'target="_blank"'],
    ['unclosed tag', '<div class="cover">'],
  ])('tries a %s attack', (_name, marker) => {
    expect(site?.html).toContain(marker);
  });

  it('keeps its script text out of the searchable text', () => {
    expect(text?.text).not.toContain('escapehatch');
    expect(text?.text).toContain('garden shed');
  });
});
