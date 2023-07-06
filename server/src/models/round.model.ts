import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Result } from './result.model';
import { IRound } from '@sh/interfaces';
import { RoundFormat, RoundType } from '@sh/enums';

@Schema({ timestamps: true })
export class Round implements IRound {
  @Prop({ required: true })
  competitionId: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ enum: RoundType, required: true })
  roundTypeId: RoundType;

  @Prop({ enum: RoundFormat, required: true })
  format: RoundFormat;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Result' }], required: true })
  results: Result[];
}

export type RoundDocument = HydratedDocument<Round>;

export const RoundSchema = SchemaFactory.createForClass(Round);
