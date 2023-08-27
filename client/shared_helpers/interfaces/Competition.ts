import { CompetitionType, CompetitionState } from '../enums';
import { IEvent, IRound, IPerson, ISchedule, IRecordType, IEventRecordPairs } from '../interfaces';

// IMPORTANT: when updating this interface, also update:
//    (1) the create competition DTO (and update DTO, if needed)
//    (2) the competition model
// And also consider the following:
//    (3) CompetitionForm component
//    (4) CompetitionResults component
//    (5) createCompetition method in the competition service
//    (6) updateCompetition method in the competition service
export interface ICompetition {
  competitionId: string;
  // This is optional, because it's not set on creation and only returned to the frontend for authorized users
  createdBy?: number; // peson ID of the moderator/admin, who created the competition
  state?: CompetitionState; // optional, because it's not needed on creation

  name: string;
  type: CompetitionType;
  city?: string; // not needed for online comps
  countryIso2: string; // for online comps there is a special value
  venue?: string; // not needed for online comps
  address?: string; // required for competitions
  latitudeMicrodegrees?: number; // not needed for online comps
  longitudeMicrodegrees?: number; // not needed for online comps
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date; // includes the time if it's not a competition (always stored as UTC for online comps)
  endDate?: Date; // competition-only
  timezone?: string; // meetup-only
  organizers: IPerson[]; // stored as references
  contact?: string; // required for competitions
  description?: string;
  competitorLimit?: number; // required for competitions
  mainEventId: string;
  events: ICompetitionEvent[];
  participants?: number; // optional, because it's not needed on creation
  compDetails?: ICompetitionDetails; // competition-only
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
  recordPairsByEvent?: IEventRecordPairs[]; // only set if competition data is requested by a moderator
}
