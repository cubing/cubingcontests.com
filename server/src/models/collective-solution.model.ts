import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { CollectiveSolution } from "~/shared/types";

@Schema({ timestamps: true })
export class CollectiveSolutionModel implements CollectiveSolution {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  attemptNumber: number;

  @Prop({ required: true })
  scramble: string;

  @Prop()
  solution: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "User", required: true })
  lastUserWhoInteracted: mongoose.Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "User" }], required: true })
  usersWhoMadeMoves: mongoose.Types.ObjectId[];

  @Prop({ required: true })
  state: 10 | 20 | 30;
}

export type CollectiveSolutionDocument = HydratedDocument<CollectiveSolutionModel>;

export const CollectiveSolutionSchema = SchemaFactory.createForClass(CollectiveSolutionModel);
