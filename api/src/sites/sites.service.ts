import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  normalizeAddress,
  type PageSource,
  type Publish,
  publishableAddress,
  type PublishResult,
  type SiteSummary,
} from '@small-web/contracts';
import { type Model, mongo, Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { PageVersion } from './schemas/page-version.schema.js';
import { Site } from './schemas/site.schema.js';
import { extractText } from './text-extractor.js';

type StoredSite = Site & { _id: Types.ObjectId };

/** How many times to try for a version number when others are publishing at once. */
const VERSION_ATTEMPTS = 5;

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

  /** A version's source as written, for its author to edit. Never rendered from here. */
  async getSource(id: string): Promise<PageSource> {
    const version = await this.getVersion(id);
    const site = await this.sites.findById(version.siteId).orFail().lean();
    return {
      address: site.address,
      title: version.title,
      html: version.html,
      authorId: site.authorId.toHexString(),
    };
  }

  /**
   * Puts a page at an address. A free address becomes a new site. An address that is
   * already the author's gets a new version, and the old ones stay, so anyone who
   * goes back still sees the page they left. Anybody else's address is a 409.
   *
   * The HTML is stored exactly as written. It is made safe when it is shown.
   */
  async publish(input: Publish): Promise<PublishResult> {
    const address = publishableAddress(input.address);
    if (address === null) {
      throw new UnprocessableEntityException(
        'Not an address you can publish at',
      );
    }
    const authorId = new Types.ObjectId(input.authorId);
    if (!(await this.people.exists({ _id: authorId }))) {
      throw new UnprocessableEntityException('No such author');
    }

    const existing = await this.sites.findOne({ address }).lean();
    if (existing) return this.addVersion(existing, authorId, input);

    return this.createSite(address, authorId, input);
  }

  private async createSite(
    address: string,
    authorId: Types.ObjectId,
    input: Publish,
  ): Promise<PublishResult> {
    const now = new Date();
    const siteId = new Types.ObjectId();

    // The version is written first, so a site never points at something missing.
    const version = await this.pageVersions.create({
      siteId,
      number: 1,
      title: input.title,
      html: input.html,
      createdAt: now,
    });

    try {
      await this.sites.create({
        _id: siteId,
        address,
        authorId,
        currentVersionId: version._id,
        versionNumber: 1,
        title: input.title,
        text: extractText(input.html),
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      await this.pageVersions.deleteOne({ _id: version._id });
      if (!isDuplicateKey(error)) throw error;

      // Someone else took the address in the moment since we looked.
      const winner = await this.sites.findOne({ address }).orFail().lean();
      return this.addVersion(winner, authorId, input);
    }

    return {
      address,
      versionId: version._id.toHexString(),
      versionNumber: 1,
      created: true,
    };
  }

  private async addVersion(
    site: StoredSite,
    authorId: Types.ObjectId,
    input: Publish,
  ): Promise<PublishResult> {
    if (!site.authorId.equals(authorId)) {
      throw new ConflictException(
        'This address already belongs to someone else',
      );
    }

    const version = await this.createNextVersion(site._id, input);

    // Only ever move forward, so a slower, older publish cannot replace a newer one.
    await this.sites.updateOne(
      { _id: site._id, versionNumber: { $lt: version.number } },
      {
        $set: {
          currentVersionId: version._id,
          versionNumber: version.number,
          title: input.title,
          text: extractText(input.html),
          updatedAt: version.createdAt,
        },
      },
    );

    return {
      address: site.address,
      versionId: version._id.toHexString(),
      versionNumber: version.number,
      created: false,
    };
  }

  private async createNextVersion(siteId: Types.ObjectId, input: Publish) {
    for (let attempt = 1; ; attempt += 1) {
      const latest = await this.pageVersions
        .findOne({ siteId }, { number: 1 })
        .sort({ number: -1 })
        .lean();
      try {
        return await this.pageVersions.create({
          siteId,
          number: (latest?.number ?? 0) + 1,
          title: input.title,
          html: input.html,
          createdAt: new Date(),
        });
      } catch (error) {
        // Another publish took this number first. Take the next one.
        if (!isDuplicateKey(error) || attempt >= VERSION_ATTEMPTS) throw error;
      }
    }
  }
}

function isDuplicateKey(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === 11000;
}
