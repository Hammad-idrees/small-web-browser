import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Env } from '../config/env.js';
import { PeopleModule } from '../people/people.module.js';
import {
  PageVersion,
  PageVersionSchema,
} from './schemas/page-version.schema.js';
import { Site, SiteSchema } from './schemas/site.schema.js';
import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';
import { VersionsController } from './versions.controller.js';

@Module({
  imports: [
    PeopleModule,
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: PageVersion.name, schema: PageVersionSchema },
    ]),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: 60_000,
            limit: config.get('PUBLISH_LIMIT_PER_MINUTE', { infer: true }),
          },
        ],
        errorMessage: 'Too many pages published. Wait a minute and try again.',
      }),
    }),
  ],
  controllers: [SitesController, VersionsController],
  providers: [SitesService],
  exports: [MongooseModule, SitesService],
})
export class SitesModule {}
