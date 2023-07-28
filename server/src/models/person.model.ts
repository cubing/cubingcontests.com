import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IPerson } from '@sh/interfaces';

@Schema({ timestamps: true })
export class Person implements IPerson {
  @Prop({ required: true, immutable: true, unique: true })
  personId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  countryId: string;
}

export type PersonDocument = HydratedDocument<Person>;

export const PersonSchema = SchemaFactory.createForClass(Person);
