import { CompetitionType, CompetitionState } from '../enums';
import { IEvent, IRound, IPerson, ISchedule, IRecordType, IRecordPair } from '../interfaces';

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
  // This is optional, because it's not set on creation and only returned to the frontend for authorized users
  createdBy?: number; // peson ID of the moderator/admin, who created the competition
  state?: CompetitionState; // optional, because it's not needed on creation

  name: string;
  type: CompetitionType;
  city: string;
  countryIso2: string;
  venue: string;
  address?: string; // required for competitions
  latitudeMicrodegrees: number;
  longitudeMicrodegrees: number;
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date; // includes the time if it's a meetup
  endDate?: Date; // competition-only
  timezone?: string; // meetup-only (it's set in the schedule for competitions)
  organizers?: IPerson[]; // stored as references
  contact?: string; // required for competitions
  description?: string;
  competitorLimit?: number; // required for competitions
  mainEventId: string;
  events: ICompetitionEvent[];
  participants?: number; // optional, because it's not needed on creation
  compDetails?: ICompetitionDetails; // only set for competitions
}

export interface ICompetitionEvent {
  event: IEvent; // stored as a reference
  rounds: IRound[]; // stored as references
}

export interface ICompetitionDetails {
  schedule: ISchedule; // stored as a reference
}

// COMPETITION DATA (just used for sending full competition information to the frontend)
export interface ICompetitionData {
  competition: ICompetition;
  persons: IPerson[]; // info about competitors from THIS competition
  activeRecordTypes: IRecordType[];
  // Only set if competition data is requested by a moderator
  recordsByEvent?: {
    eventId: string;
    recordPairs: IRecordPair[];
  }[];
}
