import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { IPerson } from "~/shared/types";
import { UserDocument } from "./user.model";

@Schema({ timestamps: true })
export class PersonModel implements IPerson {
  @Prop({ required: true, immutable: true, unique: true })
  personId: number;

  @Prop()
  wcaId?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  localizedName?: string;

  @Prop({ required: true })
  countryIso2: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "User" })
  createdBy?: UserDocument;

  @Prop()
  unapproved?: true;
}

export type PersonDocument = HydratedDocument<PersonModel>;

export const PersonSchema = SchemaFactory.createForClass(PersonModel);
