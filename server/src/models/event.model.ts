import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Event } from "~/helpers/types";
import { EventFormat, EventGroup, RoundFormat } from "~/helpers/enums";
import { EventRuleDocument } from "~/src/models/event-rule.model";

@Schema({ timestamps: true })
class EventModel implements Event {
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

  @Prop({ required: true, immutable: true })
  participants: number;

  @Prop()
  description?: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "EventRule" })
  rule?: EventRuleDocument;
}

export type EventDocument = HydratedDocument<EventModel>;

export const EventSchema = SchemaFactory.createForClass(EventModel);
