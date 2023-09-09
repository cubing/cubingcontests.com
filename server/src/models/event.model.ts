import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IEvent } from '@sh/interfaces';
import { EventFormat, EventGroup, RoundFormat } from '@sh/enums';

@Schema({ timestamps: true })
class Event implements IEvent {
  // THIS IS TEMPORARY
  // @Prop({ required: true, immutable: true, unique: true })
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
}

export type EventDocument = HydratedDocument<Event>;

export const EventSchema = SchemaFactory.createForClass(Event);
