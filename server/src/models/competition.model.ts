import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ICompetition, ICompetitionEvent } from '@sh/interfaces';
import { RoundDocument } from './round.model';
import { PersonDocument } from './person.model';
import { CompetitionState, CompetitionType } from '@sh/enums';
import { EventDocument } from './event.model';

@Schema({ _id: false })
export class CompetitionEvent implements ICompetitionEvent {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Event', required: true })
  event: EventDocument;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Round' }], required: true })
  rounds: RoundDocument[];
}

const CompetitionEventSchema = SchemaFactory.createForClass(CompetitionEvent);

@Schema({ timestamps: true })
class Competition implements ICompetition {
  @Prop({ required: true, unique: true })
  competitionId: string;

  @Prop({ required: true })
  createdBy: number;

  @Prop({ enum: CompetitionState, required: true })
  state: CompetitionState;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: CompetitionType, required: true, immutable: true })
  type: CompetitionType;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  countryIso2: string;

  @Prop({ required: true })
  venue: string;

  @Prop()
  address?: string;

  @Prop({ required: true })
  latitudeMicrodegrees: number;

  @Prop({ required: true })
  longitudeMicrodegrees: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Person' }] })
  organizers?: PersonDocument[];

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
}

export type CompetitionDocument = HydratedDocument<Competition>;

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
