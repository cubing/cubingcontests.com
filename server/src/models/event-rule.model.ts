import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IEventRule } from "~/helpers/types";

@Schema({ timestamps: true })
export class EventRuleModel implements IEventRule {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  rule: string;
}

export type EventRuleDocument = HydratedDocument<EventRuleModel>;

export const EventRuleSchema = SchemaFactory.createForClass(EventRuleModel);
