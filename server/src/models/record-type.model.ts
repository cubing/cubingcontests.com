import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IRecordType } from "~/shared/types";
import { Color, WcaRecordType } from "~/shared/enums";

@Schema({ timestamps: true })
class RecordTypeModel implements IRecordType {
  @Prop({ required: true, unique: true })
  label: string;

  @Prop({ enum: WcaRecordType, required: true, immutable: true, unique: true })
  wcaEquivalent: WcaRecordType;

  @Prop({ required: true, unique: true })
  order: number;

  @Prop({ required: true })
  active: boolean;

  @Prop({ enum: Color, required: true })
  color: Color;
}

export type RecordTypeDocument = HydratedDocument<RecordTypeModel>;

export const RecordTypeSchema = SchemaFactory.createForClass(RecordTypeModel);
