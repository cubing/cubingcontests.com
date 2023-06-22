import { Schema, Document } from 'mongoose';
import { CreatePersonDto } from '~/src/persons/dto/create-person.dto';

const PersonSchema = new Schema(
  {
    personId: { type: Number, required: true, immutable: true, unique: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
  },
  { timestamps: true },
);

export interface PersonDocument extends Document, CreatePersonDto {}

export default PersonSchema;
