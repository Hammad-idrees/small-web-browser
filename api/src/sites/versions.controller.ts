import { Controller, Get, Param } from '@nestjs/common';
import { objectIdSchema, type PageSource } from '@small-web/contracts';
import { SitesService } from './sites.service.js';

@Controller('api/versions')
export class VersionsController {
  constructor(private readonly sites: SitesService) {}

  /** The page as its author wrote it, for editing. JSON, so it is never rendered. */
  @Get(':id/source')
  source(
    @Param('id', { schema: objectIdSchema }) id: string,
  ): Promise<PageSource> {
    return this.sites.getSource(id);
  }
}
