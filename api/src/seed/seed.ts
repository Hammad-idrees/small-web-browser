import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { Env } from '../config/env.js';
import { SeedModule } from './seed.module.js';
import { SeedService } from './seed.service.js';

const app = await NestFactory.createApplicationContext(SeedModule);

try {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  if (config.get('NODE_ENV', { infer: true }) === 'production') {
    throw new Error('Refusing to seed: it deletes all existing data.');
  }
  await app.get(SeedService).run();
} finally {
  await app.close();
}
