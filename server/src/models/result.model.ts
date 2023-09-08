import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IAttempt, IResult } from '@sh/interfaces';

@Schema({ _id: false })
export class Attempt implements IAttempt {
  @Prop({ required: true })
  result: number;

  @Prop()
  memo?: number;
}

const AttemptSchema = SchemaFactory.createForClass(Attempt);

@Schema({ timestamps: true })
export class Result implements IResult {
  @Prop()
  competitionId?: string;

  @Prop({ required: true, immutable: true })
  eventId: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  compNotPublished?: boolean;

  @Prop({ required: true })
  personIds: number[];

  @Prop()
  ranking?: number;

  @Prop({ type: [AttemptSchema], required: true })
  attempts: Attempt[];

  @Prop({ required: true })
  best: number;

  @Prop({ required: true })
  average: number;

  @Prop()
  regionalSingleRecord?: string;

  @Prop()
  regionalAverageRecord?: string;

  @Prop({ unique: true })
  videoLink?: string;

  @Prop()
  discussionLink?: string;
}

export type ResultDocument = HydratedDocument<Result>;

export const ResultSchema = SchemaFactory.createForClass(Result);
