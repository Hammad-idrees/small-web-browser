import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { PageVersion } from '../sites/schemas/page-version.schema.js';
import { Site } from '../sites/schemas/site.schema.js';
import { Visit } from '../visits/schemas/visit.schema.js';
import { buildSeed } from './build-seed.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Person.name) private readonly people: Model<Person>,
    @InjectModel(Site.name) private readonly sites: Model<Site>,
    @InjectModel(PageVersion.name)
    private readonly pageVersions: Model<PageVersion>,
    @InjectModel(Visit.name) private readonly visits: Model<Visit>,
  ) {}

  /**
   * Replaces all data with the seeded web, so anything published since is removed.
   * That is what makes a walk through the data repeatable, and rerunning safe.
   */
  async run(): Promise<void> {
    const seed = buildSeed();

    await Promise.all([
      this.people.deleteMany({}),
      this.sites.deleteMany({}),
      this.pageVersions.deleteMany({}),
      this.visits.deleteMany({}),
    ]);

    await Promise.all([
      this.people.syncIndexes(),
      this.sites.syncIndexes(),
      this.pageVersions.syncIndexes(),
      this.visits.syncIndexes(),
    ]);

    await this.people.insertMany(seed.people);
    await this.pageVersions.insertMany(seed.pageVersions);
    await this.sites.insertMany(seed.sites);
    await this.visits.insertMany(seed.visits);

    this.logger.log(
      `Seeded ${seed.people.length} people, ${seed.sites.length} sites, ` +
        `${seed.pageVersions.length} page versions, ${seed.visits.length} visits`,
    );
  }
}
