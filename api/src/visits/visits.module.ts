import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from '../people/people.module.js';
import { SitesModule } from '../sites/sites.module.js';
import { Visit, VisitSchema } from './schemas/visit.schema.js';
import { VisitsController } from './visits.controller.js';
import { VisitsService } from './visits.service.js';

@Module({
  imports: [
    PeopleModule,
    SitesModule,
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [MongooseModule],
})
export class VisitsModule {}
