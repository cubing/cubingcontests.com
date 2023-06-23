import { Schema, Document } from 'mongoose';
import IRound from '@sh/interfaces/IRound';

const ResultSubschema = new Schema(
  {
    personId: { type: String, required: true },
    ranking: { type: Number, required: true },
    attempts: [{ type: Number, required: true }],
    best: { type: Number, required: true },
    average: { type: Number, required: true },
    regionalSingleRecord: { type: String, required: true },
    regionalAverageRecord: { type: String, required: true },
  },
  { _id: false },
);

const RoundSchema = new Schema(
  {
    competitionId: { type: String, required: true },
    eventId: { type: String, required: true },
    number: { type: Number, required: true },
    formatId: { type: String, required: true },
    roundTypeId: { type: String, required: true },
    results: [{ type: ResultSubschema, required: true }],
  },
  { timestamps: true },
);

export interface RoundDocument extends Document, IRound {}

export default RoundSchema;
