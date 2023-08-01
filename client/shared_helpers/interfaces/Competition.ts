import { CompetitionType, CompetitionState } from '../enums';
import { IEvent } from './Event';
import { IRound } from './Round';
import { IPerson } from './Person';

export interface ICompetitionEvent {
  event: IEvent; // stored as a reference
  rounds: IRound[]; // stored as references
}

// IMPORTANT: when updating this interface, also update:
//    (1) the create competition DTO (and update DTO,  if needed)
//    (2) the competition model
// And also consider the following:
//    (3) CompetitionForm component
//    (4) CompetitionResults component
//    (5) updateCompetition method in the competition service
//    (6) createCompetition method in the competition service
export interface ICompetition {
  competitionId: string;
  createdBy: number; // peson ID of the moderator/admin, who created the competition
  state: CompetitionState;

  name: string;
  type: CompetitionType;
  city: string;
  countryId: string; // 2 letter country code
  venue: string;
  address?: string; // required for competitions
  latitude: number;
  longitude: number;
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date | string; // includes the time if it's a meetup
  endDate?: Date | string; // competition-only, because meetups are always held on a single day
  organizers?: IPerson[]; // stored as references, returned to the frontend as objects
  contact?: string; // required for competitions
  description?: string;
  competitorLimit?: number; // required for competitions
  mainEventId: string;
  events: ICompetitionEvent[];
  participants: number;
}

export interface ICompetitionData {
  competition: ICompetition;
  persons: IPerson[]; // info about competitors from THIS competition
  timezoneOffset: number; // timezone offset from UTC in minutes
}

export interface ICompetitionModData {
  competition: ICompetition;
  persons: IPerson[]; // info about competitors from THIS competition
  // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
  records: any;
}
