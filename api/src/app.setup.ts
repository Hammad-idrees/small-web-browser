import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { Env } from './config/env.js';

/** App-level settings, shared by the real server and the e2e tests. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Standard security headers, and no X-Powered-By. Two are set per response instead:
  // a contained document sends its own Content-Security-Policy, which replaces this
  // one and allows exactly the web app to frame it. So X-Frame-Options stays off,
  // since it cannot name an allowed origin and would block that frame.
  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) });
  // Room for a page at its largest, written as JSON. Anything bigger is a 413.
  (app as NestExpressApplication).useBodyParser('json', { limit: '512kb' });
  app.enableShutdownHooks();
}
