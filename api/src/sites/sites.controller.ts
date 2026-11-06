import { Controller, Get, Param } from '@nestjs/common';
import type { SiteSummary } from '@small-web/contracts';
import { SitesService } from './sites.service.js';

@Controller('api/sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get(':address')
  resolve(@Param('address') address: string): Promise<SiteSummary> {
    return this.sites.resolve(address);
  }
}
