import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  apiErrorSchema,
  pageSourceSchema,
  type Person,
  publishResultSchema,
  searchPageSchema,
  siteSummarySchema,
} from '@small-web/contracts';
import type { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { PageVersion } from '../src/sites/schemas/page-version.schema.js';
import { Site } from '../src/sites/schemas/site.schema.js';

describe('Publishing (e2e)', () => {
  let app: INestApplication;
  let sites: Model<Site>;
  let pageVersions: Model<PageVersion>;
  let noor: Person;
  let mara: Person;

  const server = () => app.getHttpServer();
  const publish = (body: object) =>
    request(server()).post('/api/sites').send(body);
  const page = (overrides: object = {}) => ({
    address: 'driftwood.zz',
    title: 'Driftwood',
    html: '<h1>Driftwood</h1><p>Found on the strandline after a storm.</p>',
    authorId: noor.id,
    ...overrides,
  });
  const render = async (versionId: string) =>
    (await request(server()).get(`/render/versions/${versionId}`).expect(200))
      .text;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    sites = app.get(getModelToken(Site.name));
    pageVersions = app.get(getModelToken(PageVersion.name));
  });

  beforeEach(async () => {
    await app.get(SeedService).run();
    const people = (await request(server()).get('/api/people'))
      .body as Person[];
    const named = (name: string) => {
      const person = people.find((candidate) => candidate.name === name);
      if (!person) throw new Error(`No ${name}`);
      return person;
    };
    noor = named('David Miller');
    mara = named('Sarah Jones');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('a new address', () => {
    it('becomes a site that can be visited at once', async () => {
      const response = await publish(page({ address: 'DriftWood.zz' })).expect(
        201,
      );
      const result = publishResultSchema.parse(response.body);
      expect(result).toMatchObject({
        address: 'driftwood.zz',
        versionNumber: 1,
        created: true,
      });

      const resolved = siteSummarySchema.parse(
        (await request(server()).get('/api/sites/driftwood.zz').expect(200))
          .body,
      );
      expect(resolved).toMatchObject({
        title: 'Driftwood',
        authorName: 'David Miller',
        versionId: result.versionId,
      });
      expect(await render(result.versionId)).toContain('strandline');
    });

    it('can be found by search straight away', async () => {
      await publish(page()).expect(201);
      const found = searchPageSchema.parse(
        (
          await request(server())
            .get('/api/search')
            .query({ q: 'strandline' })
            .expect(200)
        ).body,
      );
      expect(found.results.map((result) => result.address)).toEqual([
        'driftwood.zz',
      ]);
    });

    it('keeps the HTML exactly as written, and contains it when shown', async () => {
      const hostile =
        '<p>Hi</p><script>parent.location="https://evil.example"</script><img src=x onerror="alert(1)">';
      const result = publishResultSchema.parse(
        (await publish(page({ html: hostile })).expect(201)).body,
      );

      const source = pageSourceSchema.parse(
        (
          await request(server())
            .get(`/api/versions/${result.versionId}/source`)
            .expect(200)
        ).body,
      );
      expect(source.html).toBe(hostile);

      const shown = await render(result.versionId);
      expect(shown).not.toContain('evil.example');
      expect(shown).not.toContain('onerror');
      expect(shown.match(/<script/g)).toHaveLength(1);
    });
  });

  describe('an address that is already taken', () => {
    it('gets a new version when its author publishes again', async () => {
      const first = publishResultSchema.parse(
        (await publish(page()).expect(201)).body,
      );
      const second = publishResultSchema.parse(
        (
          await publish(
            page({ title: 'Driftwood, revised', html: '<p>Second tide.</p>' }),
          ).expect(201)
        ).body,
      );

      expect(second).toMatchObject({ versionNumber: 2, created: false });
      const resolved = siteSummarySchema.parse(
        (await request(server()).get('/api/sites/driftwood.zz')).body,
      );
      expect(resolved).toMatchObject({
        versionId: second.versionId,
        title: 'Driftwood, revised',
      });

      // The page someone left is still there for them to go back to.
      expect(await render(first.versionId)).toContain('strandline');
      expect(await render(second.versionId)).toContain('Second tide');
    });

    it('searches only the newest version', async () => {
      await publish(page()).expect(201);
      await publish(page({ html: '<p>Second tide.</p>' })).expect(201);
      const found = searchPageSchema.parse(
        (await request(server()).get('/api/search').query({ q: 'strandline' }))
          .body,
      );
      expect(found.results).toEqual([]);
    });

    it('refuses anyone but its author', async () => {
      const response = await publish(
        page({ address: 'tidepool.zz', authorId: noor.id }),
      ).expect(409);
      expect(apiErrorSchema.parse(response.body).message).toContain(
        'belongs to someone else',
      );
      const resolved = siteSummarySchema.parse(
        (await request(server()).get('/api/sites/tidepool.zz')).body,
      );
      expect(resolved.title).toBe('The Tide Pool Journal');
    });
  });

  describe('publishing at the same moment', () => {
    it('gives a new address to exactly one of two people', async () => {
      const responses = await Promise.all([
        publish(page({ address: 'contested.zz', authorId: noor.id })),
        publish(page({ address: 'contested.zz', authorId: mara.id })),
      ]);

      expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        201, 409,
      ]);
      const site = await sites.findOne({ address: 'contested.zz' }).lean();
      expect(await sites.countDocuments({ address: 'contested.zz' })).toBe(1);
      // The loser's version was cleaned up, not left behind.
      expect(await pageVersions.countDocuments({ siteId: site?._id })).toBe(1);
      expect(
        await pageVersions.countDocuments({
          siteId: { $nin: (await sites.find().lean()).map((s) => s._id) },
        }),
      ).toBe(0);
    });

    it('numbers every version once when one author publishes many at once', async () => {
      await publish(page()).expect(201);
      const responses = await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
          publish(page({ html: `<p>Draft ${index}</p>` })),
        ),
      );

      expect(responses.every((r) => r.status === 201)).toBe(true);
      const numbers = responses
        .map((r) => publishResultSchema.parse(r.body).versionNumber)
        .sort((a, b) => a - b);
      expect(numbers).toEqual([2, 3, 4, 5, 6]);

      const site = await sites.findOne({ address: 'driftwood.zz' }).lean();
      expect(site?.versionNumber).toBe(6);
    });
  });

  describe('what is refused', () => {
    it.each([
      ['an address outside this web', { address: 'bank.com' }],
      ['an address with a path', { address: 'driftwood.zz/about' }],
      ['words instead of an address', { address: 'my lovely page' }],
      ['an empty page', { html: '   ' }],
      ['an empty title', { title: '' }],
      ['an author that is not an id', { authorId: 'me' }],
      ['a field it does not know', { versionNumber: 1 }],
    ])('%s', async (_name, change) => {
      const response = await publish(page(change)).expect(400);
      expect(apiErrorSchema.parse(response.body).message).toBe(
        'Validation failed',
      );
    });

    it('an author who does not exist', async () => {
      await publish(page({ authorId: '0'.repeat(24) })).expect(422);
    });

    it('a page too long to store', async () => {
      await publish(page({ html: 'x'.repeat(200_001) })).expect(400);
    });

    it('a request too large to read', async () => {
      const response = await publish(page({ html: 'x'.repeat(600_000) }));
      expect(response.status).toBe(413);
    });
  });

  describe('GET /api/versions/:id/source', () => {
    it('gives back what was written, with its author', async () => {
      const id = siteSummarySchema.parse(
        (await request(server()).get('/api/sites/tidepool.zz')).body,
      ).versionId;
      const source = pageSourceSchema.parse(
        (await request(server()).get(`/api/versions/${id}/source`).expect(200))
          .body,
      );
      expect(source.address).toBe('tidepool.zz');
      expect(source.html).toContain('<h1>The Tide Pool Journal</h1>');
      expect(source.authorId).toBe(mara.id);
    });

    it('gives a 404 for an unknown version', async () => {
      await request(server())
        .get(`/api/versions/${'0'.repeat(24)}/source`)
        .expect(404);
    });
  });
});
