import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { apiErrorSchema, type Person } from '@small-web/contracts';
import request from 'supertest';

describe('Publish rate limit (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // A low limit for this file only. The app reads it while it is being imported.
    vi.stubEnv('PUBLISH_LIMIT_PER_MINUTE', '3');
    const { AppModule } = await import('../src/app.module.js');
    const { configureApp } = await import('../src/app.setup.js');
    const { SeedModule } = await import('../src/seed/seed.module.js');
    const { SeedService } = await import('../src/seed/seed.service.js');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SeedModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    await app.get(SeedService).run();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await app.close();
  });

  it('refuses publishing after the limit, and says why', async () => {
    const [noor] = (await request(app.getHttpServer()).get('/api/people'))
      .body as Person[];
    const statuses: number[] = [];
    let last: request.Response | undefined;
    for (let index = 0; index < 4; index += 1) {
      last = await request(app.getHttpServer())
        .post('/api/sites')
        .send({
          address: `limit-${index}.zz`,
          title: 'Limit',
          html: '<p>x</p>',
          authorId: noor?.id,
        });
      statuses.push(last.status);
    }

    expect(statuses).toEqual([201, 201, 201, 429]);
    expect(apiErrorSchema.parse(last?.body).message).toContain(
      'Too many pages published',
    );
  });

  it('does not limit reading', async () => {
    for (let index = 0; index < 10; index += 1) {
      await request(app.getHttpServer())
        .get('/api/sites/tidepool.zz')
        .expect(200);
    }
  });
});
