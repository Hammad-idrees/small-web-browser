import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  type HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type SiteDocument = HydratedDocument<Site>;

/**
 * An address and what currently lives at it. `title` and `text` are copied from
 * the current version so that search only ever matches what a visitor would see.
 */
@Schema({ collection: 'sites', versionKey: false })
export class Site {
  @Prop({ type: String, required: true, unique: true })
  address: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', required: true })
  authorId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PageVersion',
    required: true,
  })
  currentVersionId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index(
  { title: 'text', text: 'text' },
  {
    name: 'site_search',
    weights: { title: 5, text: 1 },
    default_language: 'english',
  },
);
