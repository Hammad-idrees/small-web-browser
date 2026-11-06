import { Controller, Get, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { objectIdSchema } from '@small-web/contracts';
import type { Response } from 'express';
import type { Env } from '../config/env.js';
import { SitesService } from '../sites/sites.service.js';
import { buildContentPolicy } from './content-policy.js';
import { buildDocument } from './document-builder.js';

@Controller('render')
export class RenderController {
  private readonly contentPolicy: string;

  constructor(
    private readonly sites: SitesService,
    config: ConfigService<Env, true>,
  ) {
    this.contentPolicy = buildContentPolicy(
      config.get('WEB_ORIGIN', { infer: true }),
    );
  }

  /** Serves one page version as a contained document, for the app's iframe. */
  @Get('versions/:id')
  async renderVersion(
    @Param('id', { schema: objectIdSchema }) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const version = await this.sites.getVersion(id);
    const document = buildDocument(version);

    response.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': this.contentPolicy,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      // Revalidated each time, so an improved sanitizer applies to old versions at once.
      'Cache-Control': 'no-cache',
    });
    return document;
  }
}
