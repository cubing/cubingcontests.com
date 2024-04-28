import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IEvent } from '@sh/types';
import { EventFormat, EventGroup, RoundFormat } from '@sh/enums';
import { EventRuleDocument } from '~/src/models/event-rule.model';

@Schema({ timestamps: true })
class Event implements IEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rank: number;

  @Prop({ enum: EventFormat, required: true })
  format: EventFormat;

  @Prop({ enum: RoundFormat, required: true })
  defaultRoundFormat: RoundFormat;

  @Prop({ type: [{ type: Number, enum: EventGroup }], required: true })
  groups: EventGroup[];

  @Prop({ immutable: true })
  participants?: number;

  @Prop()
  description?: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'EventRule' })
  rule?: EventRuleDocument;
}

export type EventDocument = HydratedDocument<Event>;

export const EventSchema = SchemaFactory.createForClass(Event);
