import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { VISIT_VIAS, type VisitVia } from '@small-web/contracts';
import {
  type HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type VisitDocument = HydratedDocument<Visit>;

/**
 * A recorded fact: this person arrived at this address, at this time, this way.
 * An address that led nowhere is still a visit, with `found` false and no version.
 */
@Schema({ collection: 'visits', versionKey: false })
export class Visit {
  /** Identifies the navigation, so recording it twice cannot create two visits. */
  @Prop({ type: String, required: true, unique: true })
  entryId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PageVersion',
    default: null,
  })
  versionId: Types.ObjectId | null;

  @Prop({ type: Boolean, required: true })
  found: boolean;

  @Prop({ type: String, required: true, enum: VISIT_VIAS })
  via: VisitVia;

  @Prop({ type: Date, required: true })
  visitedAt: Date;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

// Serves a person's history, newest first, with a stable cursor.
VisitSchema.index({ personId: 1, visitedAt: -1, _id: -1 });
