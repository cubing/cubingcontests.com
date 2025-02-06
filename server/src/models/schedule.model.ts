import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IActivity, IRoom, ISchedule, IVenue } from "~/helpers/types";
import { Color } from "~/helpers/enums";

@Schema({ _id: false })
class ActivityModel implements IActivity {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  activityCode: string;

  @Prop()
  name?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: [SchemaFactory.createForClass(ActivityModel)], required: true })
  childActivities: ActivityModel[];
}

const ActivitySchema = SchemaFactory.createForClass(ActivityModel);

@Schema({ _id: false })
class RoomModel implements IRoom {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Color, required: true })
  color: Color;

  @Prop({ type: [ActivitySchema], required: true })
  activities: ActivityModel[];
}

const RoomSchema = SchemaFactory.createForClass(RoomModel);

@Schema({ _id: false })
class VenueModel implements IVenue {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  countryIso2: string;

  @Prop({ required: true })
  latitudeMicrodegrees: number;

  @Prop({ required: true })
  longitudeMicrodegrees: number;

  @Prop({ required: true })
  timezone: string;

  @Prop({ type: [RoomSchema], required: true })
  rooms: RoomModel[];
}

const VenueSchema = SchemaFactory.createForClass(VenueModel);

@Schema({ timestamps: true })
export class ScheduleModel implements ISchedule {
  @Prop({ required: true, unique: true })
  competitionId: string;

  @Prop({ type: [VenueSchema], required: true })
  venues: VenueModel[];
}

export type ScheduleDocument = HydratedDocument<ScheduleModel>;

export const ScheduleSchema = SchemaFactory.createForClass(ScheduleModel);
