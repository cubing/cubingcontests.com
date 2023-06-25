import { Schema, Document } from 'mongoose';
import ICompetition from '@sh/interfaces/Competition';

const EventSubschema = new Schema(
  {
    eventId: { type: String, required: true },
    rounds: [{ type: Schema.Types.ObjectId, ref: 'Round', required: true }],
  },
  { _id: false },
);

const CompetitionSchema = new Schema(
  {
    competitionId: { type: String, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    countryId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    mainEventId: { type: String, required: true },
    participants: Number,
    events: [{ type: EventSubschema }],
  },
  { timestamps: true },
);

export interface CompetitionDocument extends Document, ICompetition {}

export default CompetitionSchema;
