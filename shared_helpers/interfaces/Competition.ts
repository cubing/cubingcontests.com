import IEvent from './Event';
import { IRound } from './Round';
import IPerson from './Person';

export interface ICompetitionEvent {
  eventId: string;
  // string[] is for storing references to the rounds in the db
  rounds: IRound[];
}

interface ICompetition {
  competitionId: string;
  name: string;
  city: string;
  countryId: string; // 2 letter country code
  startDate: Date;
  endDate: Date;
  mainEventId: string;
  // Both of these are only set if the competition results have been posted
  participants?: number;
  events?: ICompetitionEvent[];
}

export interface ICompetitionData {
  competition: ICompetition;
  eventsInfo: IEvent[];
  persons: IPerson[];
}

export default ICompetition;
