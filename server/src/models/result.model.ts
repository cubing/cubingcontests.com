import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IResult } from '@sh/interfaces';

@Schema({ timestamps: true })
export class Result implements IResult {
  @Prop({ required: true })
  competitionId: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  compNotPublished?: boolean;

  @Prop()
  personId: string;

  @Prop({ required: true })
  personIds: number[];

  @Prop({ required: true })
  ranking: number;

  @Prop({ type: [Number], required: true })
  attempts: number[];

  @Prop({ required: true })
  best: number;

  @Prop({ required: true })
  average: number;

  @Prop()
  regionalSingleRecord?: string;

  @Prop()
  regionalAverageRecord?: string;
}

export type ResultDocument = HydratedDocument<Result>;

export const ResultSchema = SchemaFactory.createForClass(Result);
