import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IPerson } from '@sh/interfaces';

@Schema({ timestamps: true })
export class Person implements IPerson {
  @Prop({ required: true, immutable: true, unique: true })
  personId: number;

  @Prop({ immutable: true })
  wcaId?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  localizedName?: string;

  @Prop({ required: true })
  countryIso2: string;
}

export type PersonDocument = HydratedDocument<Person>;

export const PersonSchema = SchemaFactory.createForClass(Person);
