import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ICompetition, ICompetitionEvent, ICompetitionDetails } from '@sh/interfaces';
import { RoundDocument } from './round.model';
import { PersonDocument } from './person.model';
import { CompetitionState, CompetitionType } from '@sh/enums';
import { EventDocument } from './event.model';
import { ScheduleDocument } from './schedule.model';

@Schema({ _id: false })
export class CompetitionEvent implements ICompetitionEvent {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Event', required: true })
  event: EventDocument;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Round' }], required: true })
  rounds: RoundDocument[];
}

const CompetitionEventSchema = SchemaFactory.createForClass(CompetitionEvent);

@Schema({ _id: false })
export class CompetitionDetails implements ICompetitionDetails {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Schedule', required: true })
  schedule: ScheduleDocument;
}

const CompetitionDetailsSchema = SchemaFactory.createForClass(CompetitionDetails);

@Schema({ timestamps: true })
class Competition implements ICompetition {
  @Prop({ required: true, immutable: true, unique: true })
  competitionId: string;

  @Prop({ required: true })
  createdBy: number;

  @Prop({ enum: CompetitionState, required: true })
  state: CompetitionState;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: CompetitionType, required: true, immutable: true })
  type: CompetitionType;

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

  @Prop({ type: [CompetitionEventSchema] })
  events: CompetitionEvent[];

  @Prop({ default: 0 })
  participants: number;

  @Prop({ type: CompetitionDetailsSchema })
  compDetails?: CompetitionDetails;
}

export type CompetitionDocument = HydratedDocument<Competition>;

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
