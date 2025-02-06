import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ResultDocument } from "./result.model";
import { ICutoff, ITimeLimit } from "~/helpers/types";
import { RoundFormat, RoundProceed, RoundType } from "~/helpers/enums";
import { IProceed } from "~/helpers/types";

@Schema({ _id: false })
export class TimeLimitModel implements ITimeLimit {
  @Prop({ required: true })
  centiseconds: number;

  @Prop({ required: true })
  cumulativeRoundIds: string[];
}

const TimeLimitSchema = SchemaFactory.createForClass(TimeLimitModel);

@Schema({ _id: false })
export class CutoffModel implements ICutoff {
  @Prop({ required: true })
  attemptResult: number;

  @Prop({ required: true })
  numberOfAttempts: number;
}

const CutoffSchema = SchemaFactory.createForClass(CutoffModel);

@Schema({ _id: false })
export class ProceedModel implements IProceed {
  @Prop({ required: true })
  type: RoundProceed;

  @Prop({ required: true })
  value: number;
}

const ProceedSchema = SchemaFactory.createForClass(ProceedModel);

@Schema({ timestamps: true })
export class RoundModel {
  @Prop({ required: true })
  roundId: string;

  @Prop({ required: true })
  competitionId: string;

  @Prop({ enum: RoundType, required: true })
  roundTypeId: RoundType;

  @Prop({ enum: RoundFormat, required: true })
  format: RoundFormat;

  @Prop({ type: TimeLimitSchema })
  timeLimit?: TimeLimitModel;

  @Prop({ type: CutoffSchema })
  cutoff?: CutoffModel;

  @Prop({ type: ProceedSchema })
  proceed?: ProceedModel;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: "Result" }],
    required: true,
  })
  results: ResultDocument[];

  @Prop()
  open?: true;
}

export type RoundDocument = HydratedDocument<RoundModel>;

export const RoundSchema = SchemaFactory.createForClass(RoundModel);
