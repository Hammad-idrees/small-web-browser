import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  type Publish,
  type PublishResult,
  publishSchema,
  type SiteSummary,
} from '@small-web/contracts';
import { SitesService } from './sites.service.js';

@Controller('api/sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get(':address')
  resolve(@Param('address') address: string): Promise<SiteSummary> {
    return this.sites.resolve(address);
  }

  /** Anyone can publish, so publishing is the one thing that is rate limited. */
  @Post()
  @UseGuards(ThrottlerGuard)
  publish(
    @Body({ schema: publishSchema }) body: Publish,
  ): Promise<PublishResult> {
    return this.sites.publish(body);
  }
}
