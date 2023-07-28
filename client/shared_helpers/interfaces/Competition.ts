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
  state: CompetitionState; // created = 1, published = 2, finished = 3

  name: string;
  type: CompetitionType;
  city: string;
  countryId: string; // 2 letter country code
  venue?: string; // required for competitions, optional for meetups
  coordinates?: [number, number]; // required for competitions, optional for meetups
  startDate: Date; // includes the time if it's a meetup
  endDate?: Date; // competition-only, because meetups are always held on a single day
  organizers?: IPerson[]; // stored as references
  contact?: string; // competition-only
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
}

export interface ICompetitionModData {
  competition: ICompetition;
  events: IEvent[]; // info about ALL events
  persons: IPerson[]; // info about competitors from THIS competition
  // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
  records: any;
}
