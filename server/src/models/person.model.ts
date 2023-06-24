import { Schema, Document } from 'mongoose';
import IPerson from '@sh/interfaces/Person';

const PersonSchema = new Schema(
  {
    personId: { type: Number, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    countryId: { type: String, required: true },
  },
  { timestamps: true },
);

export interface PersonDocument extends Document, IPerson {}

export default PersonSchema;
