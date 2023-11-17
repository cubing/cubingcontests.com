import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ResultDocument } from './result.model';
import { IRound } from '@sh/interfaces';
import { RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { IProceed } from '@sh/interfaces';

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
  @Prop({ required: true, immutable: true })
  roundId: string;

  @Prop({ required: true, immutable: true })
  competitionId: string;

  @Prop({ enum: RoundType, required: true })
  roundTypeId: RoundType;

  @Prop({ enum: RoundFormat, required: true })
  format: RoundFormat;

  @Prop({ type: ProceedSchema })
  proceed?: Proceed;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Result' }], required: true })
  results: ResultDocument[];
}

export type RoundDocument = HydratedDocument<Round>;

export const RoundSchema = SchemaFactory.createForClass(Round);
