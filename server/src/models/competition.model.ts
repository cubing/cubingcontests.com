import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ICompetition, ICompetitionEvent } from '@sh/interfaces';
import { Round } from './round.model';
import { Person, PersonSchema } from './person.model';
import { CompetitionState, CompetitionType } from '@sh/enums';

@Schema({ _id: false })
export class CompetitionEvent implements ICompetitionEvent {
  @Prop({ required: true })
  eventId: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Round' }], required: true })
  rounds: Round[];
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
  countryId: string;

  @Prop()
  venue?: string;

  @Prop()
  coordinates: [number, number];

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'Person' }] })
  organizers?: Person[];

  @Prop()
  contact?: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  competitorLimit: number;

  @Prop({ required: true })
  mainEventId: string;

  @Prop({ type: [CompetitionEventSchema] })
  events: CompetitionEvent[];

  @Prop({ default: 0 })
  participants: number;
}

export type CompetitionDocument = HydratedDocument<Competition>;

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
