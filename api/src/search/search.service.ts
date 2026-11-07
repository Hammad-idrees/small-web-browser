import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { SearchPage, SearchQuery } from '@small-web/contracts';
import type { Model } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { Site } from '../sites/schemas/site.schema.js';
import { buildSnippet } from './snippet.js';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Site.name) private readonly sites: Model<Site>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
  ) {}

  /**
   * Finds pages by what is written in them. The index covers each page's title and
   * its readable text only, never its markup, styles or scripts, and a match in a
   * title counts five times as much as one in the body.
   */
  async search({ q, offset, limit }: SearchQuery): Promise<SearchPage> {
    const found = await this.sites
      .find(
        { $text: { $search: q } },
        {
          score: { $meta: 'textScore' },
          address: 1,
          title: 1,
          text: 1,
          authorId: 1,
        },
      )
      // Equal scores fall back to the address, so the order never changes between runs.
      .sort({ score: { $meta: 'textScore' }, address: 1 })
      .skip(offset)
      .limit(limit + 1)
      .lean();

    const page = found.slice(0, limit);
    const authors = await this.people
      .find({ _id: { $in: page.map((site) => site.authorId) } }, { name: 1 })
      .lean();
    const names = new Map(
      authors.map((person) => [person._id.toHexString(), person.name]),
    );

    return {
      results: page.map((site) => ({
        address: site.address,
        title: site.title,
        authorName: names.get(site.authorId.toHexString()) ?? 'Unknown',
        ...buildSnippet(site.text, q),
      })),
      nextOffset: found.length > limit ? offset + limit : null,
    };
  }
}
