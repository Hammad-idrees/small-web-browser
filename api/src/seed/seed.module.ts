import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { parseEnv } from '../config/env.js';
import { DatabaseModule } from '../database/database.module.js';
import { PeopleModule } from '../people/people.module.js';
import { SitesModule } from '../sites/sites.module.js';
import { VisitsModule } from '../visits/visits.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: parseEnv }),
    DatabaseModule,
    PeopleModule,
    SitesModule,
    VisitsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
