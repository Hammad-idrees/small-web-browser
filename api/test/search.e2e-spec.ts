import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { searchPageSchema } from '@small-web/contracts';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';

describe('Search (e2e)', () => {
  let app: INestApplication;

  const search = async (query: Record<string, string>) => {
    const response = await request(app.getHttpServer())
      .get('/api/search')
      .query(query)
      .expect(200);
    return searchPageSchema.parse(response.body);
  };
  const addresses = async (q: string) =>
    (await search({ q, limit: '50' })).results.map((result) => result.address);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    await app.get(SeedService).run();
  });

  afterAll(async () => {
    await app.close();
  });

  it('finds a page by a word that appears only in its body', async () => {
    expect(await addresses('cormorant')).toEqual(['saltmarsh.zz']);
  });

  it('ranks a page with the word in its title above pages with it in the body', async () => {
    const found = await addresses('lighthouse');
    expect(found[0]).toBe('harbourlight.zz');
    expect(found.length).toBeGreaterThanOrEqual(3);
  });

  it('finds other forms of a word', async () => {
    expect(await addresses('tides')).toEqual(
      expect.arrayContaining(['tidepool.zz', 'saltmarsh.zz']),
    );
  });

  it('matches every page that uses a word', async () => {
    const found = await addresses('tide');
    expect(found).toEqual(
      expect.arrayContaining(['tidepool.zz', 'saltmarsh.zz', 'nightferry.zz']),
    );
  });

  it.each([
    ['tag names', 'blockquote'],
    ['CSS', 'monospace'],
    ['attributes', 'href'],
    ['the hostile site’s script', 'escapehatch'],
  ])('does not match %s', async (_name, q) => {
    expect(await addresses(q)).toEqual([]);
  });

  it('returns nothing, not an error, when nothing matches', async () => {
    expect(await search({ q: 'xylophone' })).toEqual({
      results: [],
      nextOffset: null,
    });
  });

  it('gives each result a title, an author and a snippet with the match marked', async () => {
    const [result] = (await search({ q: 'cormorant' })).results;
    expect(result).toMatchObject({
      address: 'saltmarsh.zz',
      title: 'Walking the Salt Marsh',
      authorName: 'Mara Quill',
    });
    const marked = result?.highlights.map(({ start, length }) =>
      result.snippet.slice(start, start + length).toLowerCase(),
    );
    expect(marked).toContain('cormorant');
  });

  // Words from many different pages, so there are enough results to page through.
  const BROAD = 'tide moss maps bread bees radio press ferry lighthouse';

  it('pages through every result in a stable order', async () => {
    const all = await addresses(BROAD);
    expect(all.length).toBeGreaterThanOrEqual(8);
    const paged: string[] = [];
    let offset: number | null = 0;
    while (offset !== null) {
      const page = await search({
        q: BROAD,
        limit: '3',
        offset: String(offset),
      });
      paged.push(...page.results.map((result) => result.address));
      offset = page.nextOffset;
    }
    expect(paged).toEqual(all);
  });

  it('gives the same order every time', async () => {
    expect(await addresses('tide')).toEqual(await addresses('tide'));
  });

  it('treats a query full of symbols as text, not as an error', async () => {
    await search({ q: '(.*)+ [tide $where {}' });
  });

  it.each([
    ['an empty query', { q: '' }],
    ['a query of spaces', { q: '   ' }],
    ['a very long query', { q: 'x'.repeat(201) }],
    ['a negative offset', { q: 'tide', offset: '-1' }],
    ['a page that is too big', { q: 'tide', limit: '500' }],
  ])('refuses %s', async (_name, query) => {
    await request(app.getHttpServer())
      .get('/api/search')
      .query(query)
      .expect(400);
  });
});
