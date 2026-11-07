import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { objectIdSchema } from '@small-web/contracts';
import type { Response } from 'express';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import { SitesService } from '../sites/sites.service.js';
import { buildContentPolicy } from './content-policy.js';
import { buildDocument, MAX_TOP_INSET } from './document-builder.js';

/** Whole pixels only; anything else is refused before a document is built. */
const topInsetSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MAX_TOP_INSET)
  .default(0);

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

  /**
   * Serves one page version as a contained document, for the app's iframe.
   * `top` asks for room above the page, so the viewer's navbar can float over it.
   */
  @Get('versions/:id')
  async renderVersion(
    @Param('id', { schema: objectIdSchema }) id: string,
    @Query('top', { schema: topInsetSchema }) top: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const version = await this.sites.getVersion(id);
    const document = buildDocument(version, { topInset: top });

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
