import { Schema, Document } from 'mongoose';
import { CreateEventDto } from '~/src/events/dto/create-event.dto';

const EventSchema = new Schema(
  {
    eventId: { type: String, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    format: { type: String, required: true },
    allowedRoundFormats: [
      {
        type: String,
        required: true,
      },
    ],
    allowedCutoffFormats: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true },
);

export interface EventDocument extends Document, CreateEventDto {}

export default EventSchema;
