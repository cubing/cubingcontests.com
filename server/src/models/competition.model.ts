import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IContest, IContestEvent, ICompetitionDetails } from '@sh/interfaces';
import { RoundDocument } from './round.model';
import { PersonDocument } from './person.model';
import { ContestState, ContestType } from '@sh/enums';
import { EventDocument } from './event.model';
import { ScheduleDocument } from './schedule.model';

@Schema({ _id: false })
export class ContestEvent implements IContestEvent {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Event', required: true })
  event: EventDocument;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Round' }], required: true })
  rounds: RoundDocument[];
}

const ContestEventSchema = SchemaFactory.createForClass(ContestEvent);

@Schema({ _id: false })
export class CompetitionDetails implements ICompetitionDetails {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Schedule', required: true })
  schedule: ScheduleDocument;
}

const CompetitionDetailsSchema = SchemaFactory.createForClass(CompetitionDetails);

@Schema({ timestamps: true })
class Competition implements IContest {
  @Prop({ required: true, immutable: true, unique: true })
  competitionId: string;

  @Prop({ required: true })
  createdBy: number;

  @Prop({ enum: ContestState, required: true })
  state: ContestState;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ContestType, required: true, immutable: true })
  type: ContestType;

  @Prop()
  city?: string;

  @Prop({ required: true })
  countryIso2: string;

  @Prop()
  venue?: string;

  @Prop()
  address?: string;

  @Prop()
  latitudeMicrodegrees?: number;

  @Prop()
  longitudeMicrodegrees?: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  timezone?: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Person' }], required: true })
  organizers: PersonDocument[];

  @Prop()
  contact?: string;

  @Prop()
  description?: string;

  @Prop()
  competitorLimit?: number;

  @Prop({ required: true })
  mainEventId: string;

  @Prop({ type: [ContestEventSchema] })
  events: ContestEvent[];

  @Prop({ default: 0 })
  participants: number;

  @Prop({ type: CompetitionDetailsSchema })
  compDetails?: CompetitionDetails;
}

export type ContestDocument = HydratedDocument<Competition>;

export const ContestSchema = SchemaFactory.createForClass(Competition);
