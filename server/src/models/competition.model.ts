import { Schema, Document } from 'mongoose';
import ICompetition from '@sh/interfaces/ICompetition';

const EventSubschema = new Schema(
  {
    eventId: { type: String, required: true },
    rounds: [{ type: String, required: true }],
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
    events: [{ type: EventSubschema }],
    mainEventId: { type: String, required: true },
  },
  { timestamps: true },
);

export interface CompetitionDocument extends Document, ICompetition {}

export default CompetitionSchema;
