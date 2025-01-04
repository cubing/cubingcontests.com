import mongoose, { Schema } from "mongoose";
import { CollectiveSolution } from "@cc/shared";

const collectiveSolutionSchema = new Schema<CollectiveSolution>({
  eventId: { type: String, required: true },
  attemptNumber: { type: Number, required: true },
  scramble: { type: String, required: true },
  solution: String,
  lastUserWhoInteracted: { type: (mongoose as any).Types.ObjectId, ref: "User", required: true },
  usersWhoMadeMoves: { type: [{ type: (mongoose as any).Types.ObjectId, ref: "User" }], required: true },
  state: { type: Number, required: true },
});

export const CollectiveSolutionModel = mongoose.model("CollectiveSolution", collectiveSolutionSchema);
