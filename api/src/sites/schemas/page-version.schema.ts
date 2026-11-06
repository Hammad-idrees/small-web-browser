import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  type HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type PageVersionDocument = HydratedDocument<PageVersion>;

/**
 * One published state of a site, never changed once written. Going back shows the
 * version that was left, even if the author has published another one since.
 *
 * `html` is stored exactly as written. It is untrusted, and is only ever made safe
 * at the point of rendering.
 */
@Schema({ collection: 'page_versions', versionKey: false })
export class PageVersion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Site', required: true })
  siteId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  number: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  html: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const PageVersionSchema = SchemaFactory.createForClass(PageVersion);

PageVersionSchema.index({ siteId: 1, number: 1 }, { unique: true });
