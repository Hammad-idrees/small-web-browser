import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { normalizeAddress, type SiteSummary } from '@small-web/contracts';
import type { Model } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { PageVersion } from './schemas/page-version.schema.js';
import { Site } from './schemas/site.schema.js';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly sites: Model<Site>,
    @InjectModel(PageVersion.name)
    private readonly pageVersions: Model<PageVersion>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
  ) {}

  /** Says what lives at an address. An address with nothing there is a 404. */
  async resolve(rawAddress: string): Promise<SiteSummary> {
    const address = normalizeAddress(rawAddress);
    const site = address && (await this.sites.findOne({ address }).lean());
    if (!site) throw new NotFoundException('Nothing lives at this address');

    const author = await this.people.findById(site.authorId).orFail().lean();

    return {
      address: site.address,
      title: site.title,
      authorName: author.name,
      versionId: site.currentVersionId.toHexString(),
    };
  }

  /** Fetches one exact version of a page, which may no longer be the current one. */
  async getVersion(id: string): Promise<PageVersion> {
    const version = await this.pageVersions.findById(id).lean();
    if (!version) throw new NotFoundException('No such page version');
    return version;
  }
}
