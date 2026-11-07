import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  apiErrorSchema,
  personSchema,
  siteSummarySchema,
} from '@small-web/contracts';
import type { Model } from 'mongoose';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { PageVersion } from '../src/sites/schemas/page-version.schema.js';

describe('Resolving and rendering (e2e)', () => {
  let app: INestApplication;
  let pageVersions: Model<PageVersion>;

  const server = () => app.getHttpServer();

  const versionIdOf = async (address: string) => {
    const response = await request(server())
      .get(`/api/sites/${encodeURIComponent(address)}`)
      .expect(200);
    return siteSummarySchema.parse(response.body).versionId;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    pageVersions = app.get(getModelToken(PageVersion.name));
    await app.get(SeedService).run();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('security headers', () => {
    it('locks down JSON responses and does not say what serves them', async () => {
      const { headers } = await request(server())
        .get('/api/people')
        .expect(200);
      expect(headers['x-powered-by']).toBeUndefined();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['content-security-policy']).toBe(
        "default-src 'none';frame-ancestors 'none'",
      );
      expect(headers['strict-transport-security']).toBeDefined();
    });

    it('lets the contained document keep its own policy, framed only by the web app', async () => {
      const id = await versionIdOf('tidepool.zz');
      const { headers } = await request(server())
        .get(`/render/versions/${id}`)
        .expect(200);
      expect(headers['x-frame-options']).toBeUndefined();
      expect(headers['content-security-policy']).toContain(
        'sandbox allow-scripts',
      );
      expect(headers['content-security-policy']).toContain(
        'frame-ancestors http://localhost:3000',
      );
    });
  });

  describe('GET /api/people', () => {
    it('lists everyone by name, in a stable order', async () => {
      const response = await request(server()).get('/api/people').expect(200);
      const people = z.array(personSchema).parse(response.body);
      const names = people.map((person) => person.name);
      expect(names).toContain('David Miller');
      expect(names).toEqual([...names].sort());
    });
  });

  describe('GET /api/sites/:address', () => {
    it('says what lives at an address', async () => {
      const response = await request(server())
        .get('/api/sites/tidepool.zz')
        .expect(200);
      expect(siteSummarySchema.parse(response.body)).toMatchObject({
        address: 'tidepool.zz',
        title: 'The Tide Pool Journal',
        authorName: 'Sarah Jones',
      });
    });

    it.each(['TIDEPOOL.zz', 'http://tidepool.zz/', ' tidepool.zz#top '])(
      'treats %j as the same address',
      async (form) => {
        const response = await request(server())
          .get(`/api/sites/${encodeURIComponent(form)}`)
          .expect(200);
        expect(response.body.address).toBe('tidepool.zz');
      },
    );

    it.each([
      ['never existed', 'atlantis-archive.zz'],
      ['is not address-shaped', 'not an address'],
      ['has a path', 'tidepool.zz/about'],
    ])('gives a 404 for an address that %s', async (_name, address) => {
      const response = await request(server())
        .get(`/api/sites/${encodeURIComponent(address)}`)
        .expect(404);
      expect(apiErrorSchema.parse(response.body).statusCode).toBe(404);
    });
  });

  describe('GET /render/versions/:id', () => {
    it('serves the page as HTML', async () => {
      const id = await versionIdOf('tidepool.zz');
      const response = await request(server())
        .get(`/render/versions/${id}`)
        .expect(200)
        .expect('Content-Type', /text\/html/);
      expect(response.text).toContain('<h1>The Tide Pool Journal</h1>');
    });

    it('sends the headers that contain it', async () => {
      const id = await versionIdOf('tidepool.zz');
      const { headers } = await request(server())
        .get(`/render/versions/${id}`)
        .expect(200);
      const policy = headers['content-security-policy'];

      expect(policy).toContain('sandbox allow-scripts');
      expect(policy).not.toContain('allow-same-origin');
      expect(policy).toContain("default-src 'none'");
      expect(policy).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+'/);
      expect(policy).toContain('frame-ancestors http://localhost:3000');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['referrer-policy']).toBe('no-referrer');
    });

    it('does not let CORS expose the document to other origins', async () => {
      const id = await versionIdOf('tidepool.zz');
      const { headers } = await request(server())
        .get(`/render/versions/${id}`)
        .set('Origin', 'https://evil.example');
      expect(headers['access-control-allow-origin']).not.toBe(
        'https://evil.example',
      );
      expect(headers['access-control-allow-origin']).not.toBe('*');
    });

    it('serves the hostile site with its attacks removed', async () => {
      const id = await versionIdOf('trouble.zz');
      const { text } = await request(server())
        .get(`/render/versions/${id}`)
        .expect(200);

      expect(text.match(/<script/g)).toHaveLength(1);
      for (const forbidden of [
        'escapehatch',
        'onerror',
        'onclick',
        'onload',
        'javascript:',
        'http-equiv',
        '<base',
        '<iframe',
        '<form',
        '<img',
      ]) {
        expect(text, forbidden).not.toContain(forbidden);
      }
      expect(text).toContain('ordinary garden shed');
    });

    it('makes room above the page when asked, for the floating navbar', async () => {
      const id = await versionIdOf('tidepool.zz');
      const { text } = await request(server())
        .get(`/render/versions/${id}?top=96`)
        .expect(200);
      expect(text).toContain('<style>html{padding-top:96px}</style>');
      expect(text.match(/<script/g)).toHaveLength(1);
    });

    it('accepts only a whole number of pixels within reason for that room', async () => {
      const id = await versionIdOf('tidepool.zz');
      for (const top of ['-1', '9999', '12.5', '96px', '1;color:red']) {
        await request(server())
          .get(`/render/versions/${id}`)
          .query({ top })
          .expect(400);
      }
    });

    it('rejects a malformed id', async () => {
      const response = await request(server())
        .get('/render/versions/not-an-id')
        .expect(400);
      expect(apiErrorSchema.parse(response.body).message).toBe(
        'Validation failed',
      );
    });

    it('gives a 404 for an unknown version', async () => {
      await request(server())
        .get(`/render/versions/${'0'.repeat(24)}`)
        .expect(404);
    });

    it('still serves an older version after a newer one exists', async () => {
      const id = await versionIdOf('tidepool.zz');
      const original = await pageVersions.findById(id).orFail().lean();
      const newer = await pageVersions.create({
        siteId: original.siteId,
        number: original.number + 1,
        title: 'Changed',
        html: '<p>a newer page</p>',
        createdAt: new Date('2026-11-02T00:00:00.000Z'),
      });

      const oldPage = await request(server())
        .get(`/render/versions/${id}`)
        .expect(200);
      const newPage = await request(server())
        .get(`/render/versions/${newer._id.toHexString()}`)
        .expect(200);

      expect(oldPage.text).toContain('The Tide Pool Journal');
      expect(newPage.text).toContain('a newer page');

      await pageVersions.deleteOne({ _id: newer._id });
    });
  });
});
