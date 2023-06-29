import IEvent from './Event';
import { IRound } from './Round';
import IPerson from './Person';

export interface ICompetitionEvent {
  eventId: string;
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
  participants: number;
  events: ICompetitionEvent[];
}

export interface ICompetitionData {
  competition: ICompetition;
  eventsInfo: IEvent[];
  persons: IPerson[];
}

export default ICompetition;
