// import { Schema, Document } from 'mongoose';
// import IRound from '@sh/interfaces/Round';

// const ResultSubschema = new Schema(
//   {
//     personId: { type: String, required: true },
//     ranking: { type: Number, required: true },
//     attempts: [{ type: Number, required: true }],
//     best: { type: Number, required: true },
//     average: { type: Number, required: true },
//     regionalSingleRecord: String,
//     regionalAverageRecord: String,
//   },
//   { _id: false },
// );

// const RoundSchema = new Schema(
//   {
//     competitionId: { type: String, required: true },
//     eventId: { type: String, required: true },
//     roundTypeId: { type: String, required: true },
//     format: { type: String, required: true },
//     results: [{ type: ResultSubschema, required: true }],
//   },
//   { timestamps: true },
// );

// export interface RoundDocument extends Document, IRound {}

// export default RoundSchema;

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Person } from './person.model';
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

  @Prop({ required: true })
  regionalSingleRecord?: string;

  @Prop({ required: true })
  regionalAverageRecord?: string;
}

export const ResultSchema = SchemaFactory.createForClass(Result);

@Schema({ timestamps: true })
export class Round implements IRound {
  @Prop({ required: true })
  competitionId: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ enum: RoundType, required: true })
  roundTypeId: RoundType;

  @Prop({ enum: RoundFormat, required: true })
  format: RoundFormat;

  @Prop({ type: [ResultSchema], required: true })
  results: Result[];
}

export type RoundDocument = HydratedDocument<Round>;

export const RoundSchema = SchemaFactory.createForClass(Round);
