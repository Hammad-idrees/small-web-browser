import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  normalizeAddress,
  type RecordVisit,
  type Visit as VisitDto,
  type VisitPage,
  type VisitPageQuery,
} from '@small-web/contracts';
import { type Model, mongo, Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { PageVersion } from '../sites/schemas/page-version.schema.js';
import { Site } from '../sites/schemas/site.schema.js';
import { Visit } from './schemas/visit.schema.js';
import { decodeVisitCursor, encodeVisitCursor } from './visit-cursor.js';

type StoredVisit = Visit & { _id: Types.ObjectId };

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visits: Model<Visit>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
    @InjectModel(Site.name) private readonly sites: Model<Site>,
    @InjectModel(PageVersion.name)
    private readonly pageVersions: Model<PageVersion>,
  ) {}

  /**
   * Records that a page was shown. The entry id makes this safe to repeat: the same
   * report twice gives one visit. The same id with different details is a conflict.
   *
   * The browser is not trusted to say what it saw: a version must belong to the
   * address it is reported at, and the time is the server's.
   */
  async record(
    entryId: string,
    input: RecordVisit,
  ): Promise<{ visit: VisitDto; created: boolean }> {
    if (!(await this.people.exists({ _id: input.personId }))) {
      throw new NotFoundException('No such person');
    }

    const { address, versionId, title } = await this.resolveSeen(input);
    const details = {
      personId: new Types.ObjectId(input.personId),
      address,
      versionId,
      found: versionId !== null,
      via: input.via,
    };

    try {
      const created = await this.visits.create({
        entryId,
        ...details,
        visitedAt: new Date(),
      });
      return { visit: toDto(created.toObject(), title), created: true };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }

    const existing = await this.visits.findOne({ entryId }).orFail().lean();
    if (!sameVisit(existing, details)) {
      throw new ConflictException(
        'This entry id was already recorded with different details',
      );
    }
    return { visit: toDto(existing, title), created: false };
  }

  /** One page of someone's history, newest first. */
  async list(personId: string, query: VisitPageQuery): Promise<VisitPage> {
    if (!(await this.people.exists({ _id: personId }))) {
      throw new NotFoundException('No such person');
    }

    const filter: Record<string, unknown> = {
      personId: new Types.ObjectId(personId),
    };
    if (query.before !== undefined) {
      const cursor = decodeVisitCursor(query.before);
      if (!cursor) throw new BadRequestException('Invalid cursor');
      filter.$or = [
        { visitedAt: { $lt: cursor.visitedAt } },
        { visitedAt: cursor.visitedAt, _id: { $lt: cursor.id } },
      ];
    }

    // One extra tells us whether there is another page, without counting.
    const found = await this.visits
      .find(filter)
      .sort({ visitedAt: -1, _id: -1 })
      .limit(query.limit + 1)
      .lean();
    const page = found.slice(0, query.limit);
    const last = page.at(-1);

    const titles = await this.titlesOf(page);
    return {
      visits: page.map((visit) =>
        toDto(visit, titles.get(visit.versionId?.toHexString() ?? '') ?? null),
      ),
      nextCursor:
        found.length > query.limit && last
          ? encodeVisitCursor({ visitedAt: last.visitedAt, id: last._id })
          : null,
    };
  }

  private async resolveSeen(input: RecordVisit): Promise<{
    address: string;
    versionId: Types.ObjectId | null;
    title: string | null;
  }> {
    const normalized = normalizeAddress(input.address);

    // Nothing was there. That stays true even if something is published there later.
    if (input.versionId === null) {
      return {
        address: normalized ?? input.address,
        versionId: null,
        title: null,
      };
    }

    const version = await this.pageVersions.findById(input.versionId).lean();
    const site = version && (await this.sites.findById(version.siteId).lean());
    if (!version || !site || site.address !== normalized) {
      throw new UnprocessableEntityException(
        'That version does not belong to that address',
      );
    }
    return {
      address: site.address,
      versionId: version._id,
      title: version.title,
    };
  }

  private async titlesOf(visits: StoredVisit[]): Promise<Map<string, string>> {
    const ids = visits.flatMap((visit) =>
      visit.versionId ? [visit.versionId] : [],
    );
    if (ids.length === 0) return new Map();

    const versions = await this.pageVersions
      .find({ _id: { $in: ids } }, { title: 1 })
      .lean();
    return new Map(
      versions.map((version) => [version._id.toHexString(), version.title]),
    );
  }
}

function toDto(visit: StoredVisit, title: string | null): VisitDto {
  return {
    id: visit._id.toHexString(),
    entryId: visit.entryId,
    address: visit.address,
    title,
    found: visit.found,
    via: visit.via,
    visitedAt: visit.visitedAt.toISOString(),
  };
}

function sameVisit(
  existing: StoredVisit,
  details: Pick<Visit, 'personId' | 'address' | 'versionId' | 'via'>,
): boolean {
  const sameVersion =
    existing.versionId === null || details.versionId === null
      ? existing.versionId === details.versionId
      : existing.versionId.equals(details.versionId);
  return (
    existing.personId.equals(details.personId) &&
    existing.address === details.address &&
    existing.via === details.via &&
    sameVersion
  );
}

function isDuplicateKey(error: unknown): boolean {
  return error instanceof mongo.MongoServerError && error.code === 11000;
}
