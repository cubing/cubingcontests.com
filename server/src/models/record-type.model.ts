import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import IRecordType from '@sh/interfaces/RecordType';
import { WcaRecordType } from '@sh/enums';
import { Color } from '@sh/enums';

@Schema({ timestamps: true })
class RecordType implements IRecordType {
  @Prop({ required: true, immutable: true, unique: true })
  label: string;

  @Prop({ enum: WcaRecordType, required: true, immutable: true, unique: true })
  wcaEquivalent: WcaRecordType;

  @Prop({ required: true })
  active: boolean;

  @Prop({ enum: Color, required: true })
  color: Color;
}

export type RecordTypeDocument = HydratedDocument<RecordType>;

export const RecordTypeSchema = SchemaFactory.createForClass(RecordType);
