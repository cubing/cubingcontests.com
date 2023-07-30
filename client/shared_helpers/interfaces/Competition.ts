import { CompetitionType, CompetitionState } from '../enums';
import { IEvent } from './Event';
import { IRound } from './Round';
import { IPerson } from './Person';

export interface ICompetitionEvent {
  eventId: string;
  rounds: IRound[]; // stored as references
}

// WHEN UPDATING THIS INTERFACE, update the create competition DTO (and update DTO if needed),
// the competition model, and also consider the createCompetition method in the competition service
// and the CompetitionForm component on the frontend
export interface ICompetition {
  competitionId: string;
  createdBy: number; // peson ID of the moderator/admin, who created the competition
  state: CompetitionState;

  name: string;
  type: CompetitionType;
  city: string;
  countryId: string; // 2 letter country code
  venue: string;
  latitude: number;
  longitude: number;
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date | string; // includes the time if it's a meetup
  endDate?: Date | string; // competition-only, because meetups are always held on a single day
  organizers?: IPerson[]; // stored as references, returned to the frontend as objects
  contact?: string; // required for competitions
  description?: string;
  competitorLimit: number;
  mainEventId: string;
  events: ICompetitionEvent[];
  participants: number;
}

export interface ICompetitionData {
  competition: ICompetition;
  events: IEvent[]; // info about events held at THIS competition
  persons: IPerson[]; // info about competitors from THIS competition
  timezoneOffset: number; // timezone offset from UTC in minutes
}

export interface ICompetitionModData {
  competition: ICompetition;
  events: IEvent[]; // info about ALL events
  persons: IPerson[]; // info about competitors from THIS competition
  // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
  records: any;
}
