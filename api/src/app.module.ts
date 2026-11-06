import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { parseEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { PeopleModule } from './people/people.module.js';
import { RenderModule } from './render/render.module.js';
import { SitesModule } from './sites/sites.module.js';
import { VisitsModule } from './visits/visits.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: parseEnv }),
    DatabaseModule,
    HealthModule,
    PeopleModule,
    RenderModule,
    SitesModule,
    VisitsModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new StandardSchemaValidationPipe() },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
