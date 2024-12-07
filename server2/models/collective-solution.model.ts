import mongoose, { Schema } from "mongoose";

const collectiveSolutionSchema = new Schema({
  eventId: { type: String, required: true },
  attemptNumber: { type: Number, required: true },
  scramble: { type: String, required: true },
  solution: String,
  lastUserWhoInteracted: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  usersWhoMadeMoves: { type: [{ type: mongoose.Types.ObjectId, ref: "User" }], required: true },
  state: { type: Number, required: true },
});

export const CollectiveSolutionModel = mongoose.model("CollectiveSolution", collectiveSolutionSchema);
