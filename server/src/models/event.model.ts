import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import IEvent from '@sh/interfaces/Event';
import { EventFormat } from '@sh/enums';

@Schema({ timestamps: true })
export class Event implements IEvent {
  @Prop({ required: true, immutable: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rank: number;

  @Prop({ enum: EventFormat, required: true })
  format: EventFormat;
}

export type EventDocument = HydratedDocument<Event>;

export const EventSchema = SchemaFactory.createForClass(Event);
