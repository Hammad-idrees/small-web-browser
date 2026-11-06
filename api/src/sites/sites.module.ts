import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from '../people/people.module.js';
import {
  PageVersion,
  PageVersionSchema,
} from './schemas/page-version.schema.js';
import { Site, SiteSchema } from './schemas/site.schema.js';
import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';

@Module({
  imports: [
    PeopleModule,
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: PageVersion.name, schema: PageVersionSchema },
    ]),
  ],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [MongooseModule, SitesService],
})
export class SitesModule {}
