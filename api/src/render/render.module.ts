import { Module } from '@nestjs/common';
import { SitesModule } from '../sites/sites.module.js';
import { RenderController } from './render.controller.js';

@Module({
  imports: [SitesModule],
  controllers: [RenderController],
})
export class RenderModule {}
