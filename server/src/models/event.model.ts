import { Schema, Document } from 'mongoose';
import IEvent from '@sh/interfaces/Event';

const EventSchema = new Schema(
  {
    eventId: { type: String, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    format: { type: String, required: true },
  },
  { timestamps: true },
);

export interface EventDocument extends Document, IEvent {}

export default EventSchema;
