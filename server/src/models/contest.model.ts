import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ICompetitionDetails, IMeetupDetails } from "~/helpers/types";
import { RoundDocument } from "./round.model";
import { PersonDocument } from "./person.model";
import { ContestState, ContestType } from "~/helpers/enums";
import { EventDocument } from "./event.model";
import { ScheduleDocument } from "./schedule.model";
import { UserDocument } from "./user.model";

@Schema({ _id: false })
export class ContestEventModel {
  @Prop({ type: mongoose.Types.ObjectId, ref: "Event", required: true })
  event: EventDocument;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: "Round" }],
    required: true,
  })
  rounds: RoundDocument[];
}

const ContestEventSchema = SchemaFactory.createForClass(ContestEventModel);

@Schema({ _id: false })
export class CompetitionDetailsModel implements ICompetitionDetails {
  @Prop({ type: mongoose.Types.ObjectId, ref: "Schedule", required: true })
  schedule: ScheduleDocument;
}

const CompetitionDetailsSchema = SchemaFactory.createForClass(
  CompetitionDetailsModel,
);

@Schema({ _id: false })
export class MeetupDetailsModel implements IMeetupDetails {
  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  timeZone: string;
}

const MeetupDetailsSchema = SchemaFactory.createForClass(MeetupDetailsModel);

@Schema({ timestamps: true })
class ContestModel {
  @Prop({ required: true, unique: true })
  competitionId: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "User", required: true })
  createdBy: UserDocument;

  @Prop({ enum: ContestState, required: true })
  state: ContestState;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  shortName: string;

  @Prop({ enum: ContestType, required: true, immutable: true })
  type: ContestType;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true, immutable: true })
  countryIso2: string;

  @Prop() // TEMPORARY
  timezone?: string;

  // This is actually required, but it may be set to an empty string
  @Prop()
  venue: string;

  // Same thing here
  @Prop()
  address: string;

  @Prop({ required: true })
  latitudeMicrodegrees: number;

  @Prop({ required: true })
  longitudeMicrodegrees: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({
    type: [{ type: mongoose.Types.ObjectId, ref: "Person" }],
    required: true,
  })
  organizers: PersonDocument[];

  @Prop()
  contact?: string;

  @Prop() // this is not set to required, since that would also disallow ''
  description: string;

  @Prop()
  competitorLimit?: number;

  @Prop({ type: [ContestEventSchema] })
  events: ContestEventModel[];

  @Prop({ default: 0 })
  participants: number;

  @Prop()
  queuePosition?: number;

  @Prop({ type: CompetitionDetailsSchema })
  compDetails?: CompetitionDetailsModel;

  @Prop({ type: MeetupDetailsSchema })
  meetupDetails?: MeetupDetailsModel;
}

export type ContestDocument = HydratedDocument<ContestModel>;

export const ContestSchema = SchemaFactory.createForClass(ContestModel);
