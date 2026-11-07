import { normalizeAddress, type VisitVia } from '@small-web/contracts';
import { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { extractText } from '../sites/text-extractor.js';
import { PEOPLE } from './data/people.js';
import { SITES } from './data/sites.js';
import { TRAILS } from './data/trails.js';

/** Fixed, so the seeded hour is identical on every run. */
export const SEED_HOUR_START = new Date('2026-11-01T09:00:00.000Z');
const SITES_PUBLISHED_AT = new Date('2026-10-01T09:00:00.000Z');
const MINUTE_MS = 60_000;

/** The same key always produces the same id, on any machine. */
function seedId(kind: string, key: string): Types.ObjectId {
  const hash = createHash('sha1').update(`${kind}:${key}`).digest('hex');
  return new Types.ObjectId(hash.slice(0, 24));
}

/** A varied but repeatable pause before step `index` of a trail. */
function secondsBeforeStep(index: number): number {
  return index === 0 ? 0 : 40 + ((index * 23) % 50);
}

/** Builds every document to insert. Pure: it never reads the clock or randomness. */
export function buildSeed() {
  const people = PEOPLE.map((name) => ({
    _id: seedId('person', name),
    name,
  }));

  const pageVersions = SITES.map((site) => ({
    _id: seedId('version', `${site.address}:1`),
    siteId: seedId('site', site.address),
    number: 1,
    title: site.title,
    html: site.html,
    createdAt: SITES_PUBLISHED_AT,
  }));

  const sites = SITES.map((site) => ({
    _id: seedId('site', site.address),
    address: site.address,
    authorId: seedId('person', site.author),
    currentVersionId: seedId('version', `${site.address}:1`),
    versionNumber: 1,
    title: site.title,
    text: extractText(site.html),
    createdAt: SITES_PUBLISHED_AT,
    updatedAt: SITES_PUBLISHED_AT,
  }));

  const existing = new Set(SITES.map((site) => site.address));

  const visits = TRAILS.flatMap((trail, trailIndex) => {
    let visitedAtMs = SEED_HOUR_START.getTime() + trail.startMinute * MINUTE_MS;

    return trail.steps.map(([via, rawAddress], stepIndex) => {
      const address = normalizeAddress(rawAddress);
      if (address === null) {
        throw new Error(`Seed trail has an invalid address: ${rawAddress}`);
      }

      visitedAtMs += secondsBeforeStep(stepIndex) * 1000;
      const entryId = `seed-${trailIndex}-${stepIndex}`;
      const found = existing.has(address);

      return {
        _id: seedId('visit', entryId),
        entryId,
        personId: seedId('person', trail.person),
        address,
        versionId: found ? seedId('version', `${address}:1`) : null,
        found,
        via: via satisfies VisitVia,
        visitedAt: new Date(visitedAtMs),
      };
    });
  });

  return { people, sites, pageVersions, visits };
}

export type SeedDocuments = ReturnType<typeof buildSeed>;
