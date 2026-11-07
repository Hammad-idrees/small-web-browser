import { Controller, Get, Query } from '@nestjs/common';
import {
  type SearchPage,
  type SearchQuery,
  searchQuerySchema,
} from '@small-web/contracts';
import { SearchService } from './search.service.js';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query({ schema: searchQuerySchema }) query: SearchQuery,
  ): Promise<SearchPage> {
    return this.searchService.search(query);
  }
}
