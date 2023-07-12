import { CompetitionType } from '../enums';
import { IEvent } from './Event';
import { IRound } from './Round';
import { IPerson } from './Person';

export interface ICompetitionEvent {
  eventId: string;
  rounds: IRound[];
}

// UPDATE THE CREATE COMPETITION DTO AND THE COMPETITION MODEL, WHEN UPDATING THIS INTERFACE
export interface ICompetition {
  competitionId: string;
  name: string;
  type: CompetitionType;
  city: string;
  countryId: string; // 2 letter country code
  startDate: Date;
  endDate: Date;
  description?: string;
  mainEventId: string;
  participants: number;
  events: ICompetitionEvent[];
}

export interface ICompetitionData {
  competition: ICompetition;
  events: IEvent[]; // info about events held at THIS competition
  persons: IPerson[]; // info about competitors from THIS competition
}

export interface ICompetitionModData {
  competition: ICompetition;
  events: IEvent[]; // info about ALL events
  persons: IPerson[]; // info about competitors from THIS competition
  // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
  records: any;
}
