import { ContestType, ContestState } from '../enums';
import { IEvent, IRound, IPerson, ISchedule, IRecordType, IEventRecordPairs } from '../interfaces';

/**
 * IMPORTANT: when updating this interface, also update:
 *    (1) the create contest DTO (and update DTO, if needed)
 *    (2) the contest model
 * And also consider the following:
 *    (3) CompetitionForm component
 *    (4) ContestResults component
 *    (5) createContest method in the contest service
 *    (6) updateCompetition method in the contest service
 */
export interface IContest {
  competitionId: string;
  // This is optional, because it's not set on creation and only returned to the frontend for authorized users
  createdBy?: number; // peson ID of the moderator/admin, who created the contest
  state?: ContestState; // optional, because it's not needed on creation

  name: string;
  type: ContestType;
  city?: string; // not needed for online comps
  countryIso2: string; // for online comps there is a special value
  venue?: string; // not needed for online comps
  address?: string; // not needed for online comps
  latitudeMicrodegrees?: number; // vertical coordinate (Y); ranges from -90 to 90; not needed for online comps
  longitudeMicrodegrees?: number; // horizontal coordinate (X); ranges from -180 to 180; not needed for online comps
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date; // includes the time if it's not a competition type (always stored as UTC for online comps)
  endDate?: Date; // competition-only
  timezone?: string; // meetup-only; not needed on creation
  organizers: IPerson[]; // stored as references
  contact?: string;
  description?: string;
  competitorLimit?: number; // required for competitions
  mainEventId: string;
  events: IContestEvent[];
  participants?: number; // optional, because it's not needed on creation
  // IMPORTANT: this is not set when importing a competition and must be set manually by an admin
  compDetails?: ICompetitionDetails; // competition-only
}

export interface IContestEvent {
  event: IEvent; // stored as a reference
  rounds: IRound[]; // stored as references
}

export interface ICompetitionDetails {
  schedule: ISchedule; // stored as a reference
}

// CONTEST DATA (just used for sending full contest information to the frontend)
export interface IContestData {
  contest: IContest;
  persons: IPerson[]; // info about competitors who competed in this contest
  activeRecordTypes: IRecordType[];
  recordPairsByEvent?: IEventRecordPairs[]; // only set if contest data is requested by a moderator
}
