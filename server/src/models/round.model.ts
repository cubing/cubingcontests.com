import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ResultDocument } from './result.model';
import { ICutoff, IRound, ITimeLimit } from '@sh/types';
import { RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { IProceed } from '@sh/types';

@Schema({ _id: false })
export class TimeLimit implements ITimeLimit {
  @Prop({ required: true })
  centiseconds: number;

  @Prop({ required: true })
  cumulativeRoundIds: string[];
}

const TimeLimitSchema = SchemaFactory.createForClass(TimeLimit);

@Schema({ _id: false })
export class Cutoff implements ICutoff {
  @Prop({ required: true })
  attemptResult: number;

  @Prop({ required: true })
  numberOfAttempts: number;
}

const CutoffSchema = SchemaFactory.createForClass(Cutoff);

@Schema({ _id: false })
export class Proceed implements IProceed {
  @Prop({ required: true })
  type: RoundProceed;

  @Prop({ required: true })
  value: number;
}

const ProceedSchema = SchemaFactory.createForClass(Proceed);

@Schema({ timestamps: true })
export class Round implements IRound {
  @Prop({ required: true })
  roundId: string;

  @Prop({ required: true })
  competitionId: string;

  @Prop({ enum: RoundType, required: true })
  roundTypeId: RoundType;

  @Prop({ enum: RoundFormat, required: true })
  format: RoundFormat;

  @Prop({ type: TimeLimitSchema })
  timeLimit?: TimeLimit;

  @Prop({ type: CutoffSchema })
  cutoff?: Cutoff;

  @Prop({ type: ProceedSchema })
  proceed?: Proceed;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Result' }], required: true })
  results: ResultDocument[];
}

export type RoundDocument = HydratedDocument<Round>;

export const RoundSchema = SchemaFactory.createForClass(Round);
