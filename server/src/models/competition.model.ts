import { Schema, Document } from 'mongoose';
import { CreateCompetitionDto } from '~/src/competitions/dto/create-competition.dto';

const CompetitionSchema = new Schema(
  {
    id: { type: String, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    // events: [EventSubschema],
    mainEventId: { type: String, required: true },
  },
  { timestamps: true },
);

export interface CompetitionDocument extends Document, CreateCompetitionDto {}

export default CompetitionSchema;
