import IEvent from './Event';
import IRound from './Round';
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
  events: IEvent[]; // info about events held at THIS competition
  persons: IPerson[];
}

export interface ICompetitionModData {
  competition: ICompetition;
  events: IEvent[]; // info about ALL events
  singleRecords: any;
  avgRecords: any;
}

export default ICompetition;
