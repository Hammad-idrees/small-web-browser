import {
  Body,
  Controller,
  Get,
  type INestApplication,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { apiErrorSchema } from '@small-web/contracts';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const probeSchema = z.object({ name: z.string().min(1) });

@Controller('probe')
class ProbeController {
  @Post()
  echo(@Body({ schema: probeSchema }) body: z.infer<typeof probeSchema>) {
    return body;
  }

  @Get('boom')
  boom() {
    throw new Error('secret internal detail');
  }
}

describe('App foundation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports MongoDB as up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.details.mongodb.status).toBe('up');
  });

  it('allows the configured web origin through CORS', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('returns the shared error shape for an unknown route', async () => {
    const response = await request(app.getHttpServer())
      .get('/nope')
      .expect(404);
    expect(apiErrorSchema.parse(response.body)).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
    });
  });

  it('validates bodies with a schema and reports each problem', async () => {
    const response = await request(app.getHttpServer())
      .post('/probe')
      .send({ name: '' })
      .expect(400);
    const body = apiErrorSchema.parse(response.body);
    expect(body.message).toBe('Validation failed');
    expect(body.details).toEqual([expect.stringContaining('name')]);
  });

  it('passes valid bodies through', async () => {
    await request(app.getHttpServer())
      .post('/probe')
      .send({ name: 'tide' })
      .expect(201, { name: 'tide' });
  });

  it('hides internal details on unexpected errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/probe/boom')
      .expect(500);
    expect(apiErrorSchema.parse(response.body).message).toBe(
      'Something went wrong',
    );
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });
});
