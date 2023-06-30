import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import IRound, { IResult } from '@sh/interfaces/Round';
import { RoundFormat, RoundType } from '@sh/enums';

@Schema({ _id: false })
class Result implements IResult {
  @Prop({ required: true })
  personId: string;

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

export const ResultSchema = SchemaFactory.createForClass(Result);

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

  @Prop({ type: [ResultSchema], required: true })
  results: Result[];
}

export type RoundDocument = HydratedDocument<Round>;

export const RoundSchema = SchemaFactory.createForClass(Round);
