import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IEventRule } from '@sh/interfaces';

@Schema({ timestamps: true })
export class EventRule implements IEventRule {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  rule: string;
}

export type EventRuleDocument = HydratedDocument<EventRule>;

export const EventRuleSchema = SchemaFactory.createForClass(EventRule);
