import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.js';

/** App-level settings, shared by the real server and the e2e tests. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) });
  // Room for a page at its largest, written as JSON. Anything bigger is a 413.
  (app as NestExpressApplication).useBodyParser('json', { limit: '512kb' });
  app.enableShutdownHooks();
}
