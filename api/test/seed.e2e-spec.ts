import type { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { Person } from '../src/people/schemas/person.schema.js';
import { DEMO_WALK } from '../src/seed/data/trails.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { PageVersion } from '../src/sites/schemas/page-version.schema.js';
import { Site } from '../src/sites/schemas/site.schema.js';
import { Visit } from '../src/visits/schemas/visit.schema.js';

describe('Seed (e2e)', () => {
  let app: INestApplicationContext;
  let seed: SeedService;
  let people: Model<Person>;
  let sites: Model<Site>;
  let pageVersions: Model<PageVersion>;
  let visits: Model<Visit>;

  /** Everything in the database, in a stable order. */
  const dump = async () =>
    JSON.stringify({
      people: await people.find().sort('_id').lean(),
      sites: await sites.find().sort('_id').lean(),
      pageVersions: await pageVersions.find().sort('_id').lean(),
      visits: await visits.find().sort('_id').lean(),
    });

  /** A valid new site document, borrowing its references from a seeded one. */
  const newSiteAt = async (address: string) => {
    const site = await sites.findOne().orFail().lean();
    return {
      address,
      authorId: site.authorId,
      currentVersionId: site.currentVersionId,
      title: site.title,
      text: site.text,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  };

  const searchAddresses = async (term: string) => {
    const results = await sites
      .find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .lean();
    return results.map((site) => site.address);
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [SeedModule] }).compile();
    app.useLogger(false);
    seed = app.get(SeedService);
    people = app.get(getModelToken(Person.name));
    sites = app.get(getModelToken(Site.name));
    pageVersions = app.get(getModelToken(PageVersion.name));
    visits = app.get(getModelToken(Visit.name));
    await seed.run();
  });

  afterAll(async () => {
    await app.close();
  });

  it('gives identical data, with identical ids, when run twice', async () => {
    const first = await dump();
    await seed.run();
    expect(await dump()).toBe(first);
  });

  it('removes anything added since the last run', async () => {
    const before = await sites.countDocuments();
    await sites.create(await newSiteAt('added.zz'));
    expect(await sites.countDocuments()).toBe(before + 1);

    await seed.run();
    expect(await sites.countDocuments()).toBe(before);
    expect(await sites.findOne({ address: 'added.zz' })).toBeNull();
  });

  it('points every site at a version that belongs to it', async () => {
    const all = await sites.find().lean();
    for (const site of all) {
      const version = await pageVersions.findById(site.currentVersionId).lean();
      expect(version?.siteId.toString()).toBe(site._id.toString());
    }
  });

  it('points every found visit at a real version', async () => {
    const found = await visits.find({ found: true }).lean();
    expect(found.length).toBeGreaterThan(0);
    for (const visit of found) {
      expect(
        await pageVersions.exists({ _id: visit.versionId }),
      ).not.toBeNull();
    }
  });

  it('rejects a second site at an address', async () => {
    await expect(
      sites.create(await newSiteAt('tidepool.zz')),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('rejects a second visit with the same entry id', async () => {
    const visit = await visits.findOne().orFail().lean();
    await expect(
      visits.create({
        entryId: visit.entryId,
        personId: visit.personId,
        address: visit.address,
        versionId: visit.versionId,
        found: visit.found,
        via: visit.via,
        visitedAt: visit.visitedAt,
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  describe('search has something to choose between', () => {
    it('finds a word that appears only in one page body', async () => {
      expect(await searchAddresses('cormorant')).toEqual(['saltmarsh.zz']);
    });

    it('ranks a title match above body matches', async () => {
      const results = await searchAddresses(DEMO_WALK.searchTerm);
      expect(results[0]).toBe('harbourlight.zz');
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('matches several pages for a shared word', async () => {
      const results = await searchAddresses('tide');
      expect(results).toEqual(
        expect.arrayContaining([
          'tidepool.zz',
          'saltmarsh.zz',
          'nightferry.zz',
        ]),
      );
    });

    it('does not match markup, styles or scripts', async () => {
      expect(await searchAddresses('blockquote')).toEqual([]);
      expect(await searchAddresses('escapehatch')).toEqual([]);
    });
  });
});
