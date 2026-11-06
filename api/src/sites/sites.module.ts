import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PageVersion,
  PageVersionSchema,
} from './schemas/page-version.schema.js';
import { Site, SiteSchema } from './schemas/site.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: PageVersion.name, schema: PageVersionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SitesModule {}
