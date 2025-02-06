import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { IAttempt } from "~/helpers/types";
import { UserDocument } from "./user.model";

@Schema({ _id: false })
export class AttemptModel implements IAttempt {
  @Prop({ required: true })
  result: number;

  @Prop()
  memo?: number;
}

const AttemptSchema = SchemaFactory.createForClass(AttemptModel);

@Schema({ timestamps: true })
export class ResultModel {
  @Prop()
  competitionId?: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  unapproved?: true;

  @Prop({ required: true })
  personIds: number[];

  @Prop()
  ranking?: number;

  @Prop({ type: [AttemptSchema], required: true })
  attempts: AttemptModel[];

  @Prop({ required: true })
  best: number;

  @Prop({ required: true })
  average: number;

  @Prop()
  regionalSingleRecord?: string;

  @Prop()
  regionalAverageRecord?: string;

  @Prop()
  proceeds?: true;

  @Prop()
  videoLink?: string;

  @Prop()
  discussionLink?: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "User" })
  createdBy: UserDocument;
}

export type ResultDocument = HydratedDocument<ResultModel>;

export const ResultSchema = SchemaFactory.createForClass(ResultModel);
