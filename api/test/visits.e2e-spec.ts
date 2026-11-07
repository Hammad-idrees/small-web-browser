import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  apiErrorSchema,
  type Person,
  siteSummarySchema,
  visitPageSchema,
  visitSchema,
} from '@small-web/contracts';
import { type Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { Visit } from '../src/visits/schemas/visit.schema.js';

describe('Visits and history (e2e)', () => {
  let app: INestApplication;
  let visits: Model<Visit>;
  let people: Person[];

  const server = () => app.getHttpServer();
  const personNamed = (name: string) => {
    const person = people.find((candidate) => candidate.name === name);
    if (!person) throw new Error(`No ${name}`);
    return person;
  };
  const versionOf = async (address: string) => {
    const response = await request(server()).get(`/api/sites/${address}`);
    return siteSummarySchema.parse(response.body).versionId;
  };
  const put = (entryId: string, body: object) =>
    request(server()).put(`/api/visits/${entryId}`).send(body);

  /** Every visit for a person, following cursors to the end. */
  const everything = async (personId: string, limit: number) => {
    const all = [];
    let before: string | null = null;
    for (let page = 0; page < 100; page += 1) {
      const query: Record<string, string> = { limit: String(limit) };
      if (before) query.before = before;
      const response = await request(server())
        .get(`/api/people/${personId}/visits`)
        .query(query)
        .expect(200);
      const body = visitPageSchema.parse(response.body);
      all.push(...body.visits);
      before = body.nextCursor;
      if (!before) break;
    }
    return all;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    visits = app.get(getModelToken(Visit.name));
  });

  beforeEach(async () => {
    await app.get(SeedService).run();
    const response = await request(server()).get('/api/people');
    people = response.body as Person[];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /api/visits/:entryId', () => {
    it('records a visit to a page, with the server’s time', async () => {
      const noor = personNamed('David Miller');
      const before = Date.now();
      const response = await put(randomUUID(), {
        personId: noor.id,
        address: 'TIDEPOOL.zz',
        versionId: await versionOf('tidepool.zz'),
        via: 'typed',
      }).expect(201);

      const visit = visitSchema.parse(response.body);
      expect(visit).toMatchObject({
        address: 'tidepool.zz',
        title: 'The Tide Pool Journal',
        found: true,
        via: 'typed',
      });
      expect(Date.parse(visit.visitedAt)).toBeGreaterThanOrEqual(before - 1000);
    });

    it('records an address that led nowhere', async () => {
      const response = await put(randomUUID(), {
        personId: personNamed('Sarah Jones').id,
        address: 'never-was.zz',
        versionId: null,
        via: 'link',
      }).expect(201);
      expect(visitSchema.parse(response.body)).toMatchObject({
        address: 'never-was.zz',
        found: false,
        title: null,
      });
    });

    it('gives back the same visit when the same report arrives twice', async () => {
      const entryId = randomUUID();
      const body = {
        personId: personNamed('David Miller').id,
        address: 'tidepool.zz',
        versionId: await versionOf('tidepool.zz'),
        via: 'link',
      };
      const first = await put(entryId, body).expect(201);
      const second = await put(entryId, body).expect(200);

      expect(second.body).toEqual(first.body);
      expect(await visits.countDocuments({ entryId })).toBe(1);
    });

    it('records only one visit when the same report arrives at once', async () => {
      const entryId = randomUUID();
      const body = {
        personId: personNamed('David Miller').id,
        address: 'tidepool.zz',
        versionId: await versionOf('tidepool.zz'),
        via: 'link',
      };
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => put(entryId, body)),
      );

      expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        200, 200, 200, 200, 201,
      ]);
      expect(await visits.countDocuments({ entryId })).toBe(1);
    });

    it('refuses to reuse an entry id for a different visit', async () => {
      const entryId = randomUUID();
      const personId = personNamed('David Miller').id;
      await put(entryId, {
        personId,
        address: 'tidepool.zz',
        versionId: await versionOf('tidepool.zz'),
        via: 'link',
      }).expect(201);

      const response = await put(entryId, {
        personId,
        address: 'oldmaps.zz',
        versionId: await versionOf('oldmaps.zz'),
        via: 'link',
      }).expect(409);
      expect(apiErrorSchema.parse(response.body).statusCode).toBe(409);
    });

    it('refuses a version reported at the wrong address', async () => {
      await put(randomUUID(), {
        personId: personNamed('David Miller').id,
        address: 'tidepool.zz',
        versionId: await versionOf('oldmaps.zz'),
        via: 'link',
      }).expect(422);
    });

    it('refuses a version that does not exist', async () => {
      await put(randomUUID(), {
        personId: personNamed('David Miller').id,
        address: 'tidepool.zz',
        versionId: '0'.repeat(24),
        via: 'link',
      }).expect(422);
    });

    it('refuses a person who does not exist', async () => {
      await put(randomUUID(), {
        personId: '0'.repeat(24),
        address: 'tidepool.zz',
        versionId: null,
        via: 'link',
      }).expect(404);
    });

    it.each([
      ['an entry id with a bad character', 'not.valid', {}],
      ['an entry id that is too long', 'x'.repeat(65), {}],
      ['an unknown way of arriving', 'ok', { via: 'teleport' }],
      ['a missing address', 'ok', { address: '' }],
      ['a time chosen by the browser', 'ok', { visitedAt: '2020-01-01' }],
      ['a found flag chosen by the browser', 'ok', { found: true }],
    ])('refuses %s', async (_name, entryId, change) => {
      await put(entryId, {
        personId: personNamed('David Miller').id,
        address: 'tidepool.zz',
        versionId: null,
        via: 'link',
        ...change,
      }).expect(400);
    });
  });

  describe('GET /api/people/:personId/visits', () => {
    it('lists the whole seeded history across pages, newest first, with no repeats', async () => {
      const noor = personNamed('David Miller');
      const all = await everything(noor.id, 4);
      const stored = await visits.countDocuments({
        personId: new Types.ObjectId(noor.id),
      });

      expect(all).toHaveLength(stored);
      expect(new Set(all.map((visit) => visit.id)).size).toBe(all.length);
      const times = all.map((visit) => Date.parse(visit.visitedAt));
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('gives each person their own history', async () => {
      const noor = await everything(personNamed('David Miller').id, 50);
      const mara = await everything(personNamed('Sarah Jones').id, 50);
      expect(noor.length).toBeGreaterThan(mara.length);
      expect(noor.map((v) => v.id)).not.toEqual(
        expect.arrayContaining(mara.map((v) => v.id)),
      );
    });

    it('includes titles as they were seen, and dead addresses', async () => {
      const all = await everything(personNamed('David Miller').id, 50);
      expect(all).toContainEqual(
        expect.objectContaining({
          address: 'tidepool.zz',
          title: 'The Tide Pool Journal',
          found: true,
        }),
      );
      expect(all).toContainEqual(
        expect.objectContaining({
          address: 'atlantis-archive.zz',
          title: null,
          found: false,
        }),
      );
    });

    it('keeps visits at the same moment in a stable order across pages', async () => {
      const personId = personNamed('Ben Taylor').id;
      const sameMoment = new Date('2026-11-01T09:59:00.000Z');
      await visits.insertMany(
        Array.from({ length: 5 }, (_, index) => ({
          entryId: `tie-${index}`,
          personId: new Types.ObjectId(personId),
          address: 'tidepool.zz',
          versionId: null,
          found: false,
          via: 'typed',
          visitedAt: sameMoment,
        })),
      );

      const all = await everything(personId, 2);
      const ties = all.filter((visit) => visit.entryId.startsWith('tie-'));
      expect(ties).toHaveLength(5);
      expect(new Set(all.map((visit) => visit.id)).size).toBe(all.length);
    });

    it('does not shift pages when someone visits while another scrolls', async () => {
      const noor = personNamed('David Miller');
      const first = visitPageSchema.parse(
        (
          await request(server())
            .get(`/api/people/${noor.id}/visits`)
            .query({ limit: 5 })
        ).body,
      );

      await put(randomUUID(), {
        personId: noor.id,
        address: 'tidepool.zz',
        versionId: null,
        via: 'typed',
      }).expect(201);

      const second = visitPageSchema.parse(
        (
          await request(server())
            .get(`/api/people/${noor.id}/visits`)
            .query({ limit: 5, before: first.nextCursor })
        ).body,
      );
      const firstIds = new Set(first.visits.map((visit) => visit.id));
      expect(second.visits.some((visit) => firstIds.has(visit.id))).toBe(false);
    });

    it('says when there is nothing more', async () => {
      const response = await request(server())
        .get(`/api/people/${personNamed('Sarah Jones').id}/visits`)
        .query({ limit: 50 })
        .expect(200);
      expect(visitPageSchema.parse(response.body).nextCursor).toBeNull();
    });

    it.each([
      ['a cursor it did not give out', { before: 'nonsense' }],
      ['a page that is too big', { limit: '500' }],
      ['a page of nothing', { limit: '0' }],
    ])('refuses %s', async (_name, query) => {
      await request(server())
        .get(`/api/people/${personNamed('David Miller').id}/visits`)
        .query(query)
        .expect(400);
    });

    it('gives a 404 for someone who does not exist', async () => {
      await request(server())
        .get(`/api/people/${'0'.repeat(24)}/visits`)
        .expect(404);
    });
  });
});
