import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ICompetition, ICompetitionEvent } from '@sh/interfaces';
import { Round } from './round.model';

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
  @Prop({ required: true, immutable: true, unique: true })
  competitionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  countryId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  description?: string;

  @Prop({ required: true })
  mainEventId: string;

  @Prop({ default: 0 })
  participants: number;

  @Prop({ type: [CompetitionEventSchema] })
  events: CompetitionEvent[];
}

export type CompetitionDocument = HydratedDocument<Competition>;

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
