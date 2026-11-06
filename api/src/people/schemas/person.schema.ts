import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type PersonDocument = HydratedDocument<Person>;

@Schema({ collection: 'people', versionKey: false })
export class Person {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
