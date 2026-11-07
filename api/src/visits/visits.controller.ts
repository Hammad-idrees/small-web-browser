import { Body, Controller, Get, Param, Put, Query, Res } from '@nestjs/common';
import {
  entryIdSchema,
  objectIdSchema,
  type RecordVisit,
  recordVisitSchema,
  type Visit,
  type VisitPage,
  type VisitPageQuery,
  visitPageQuerySchema,
} from '@small-web/contracts';
import type { Response } from 'express';
import { VisitsService } from './visits.service.js';

@Controller('api')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  /** Records a visit. Repeating the same report is safe, and gives back the same visit. */
  @Put('visits/:entryId')
  async record(
    @Param('entryId', { schema: entryIdSchema }) entryId: string,
    @Body({ schema: recordVisitSchema }) body: RecordVisit,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Visit> {
    const { visit, created } = await this.visits.record(entryId, body);
    response.status(created ? 201 : 200);
    return visit;
  }

  @Get('people/:personId/visits')
  list(
    @Param('personId', { schema: objectIdSchema }) personId: string,
    @Query({ schema: visitPageQuerySchema }) query: VisitPageQuery,
  ): Promise<VisitPage> {
    return this.visits.list(personId, query);
  }
}
