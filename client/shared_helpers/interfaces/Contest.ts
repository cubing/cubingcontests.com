import { ContestState, ContestType } from '../enums.ts';
import { IEvent, IEventRecordPairs, IFeUser, IPerson, IRecordType, IRound, ISchedule } from '../types.ts';

/**
 * IMPORTANT: when updating this interface, also update:
 *    (1) the contest DTO
 *    (2) the contest model
 * And also consider the following:
 *    (3) ContestForm component
 *    (4) createContest method in the contests service
 *    (5) updateContest method in the contests service
 */
export interface IContest {
  competitionId: string;
  // This is optional, because it's only returned to the frontend for mods
  createdBy?: unknown; // user ID of the mod/admin who created the contest
  state: ContestState;

  name: string;
  shortName: string;
  type: ContestType;
  city: string;
  countryIso2: string;
  venue: string;
  address: string;
  latitudeMicrodegrees: number; // vertical coordinate (Y); ranges from -90 to 90
  longitudeMicrodegrees: number; // horizontal coordinate (X); ranges from -180 to 180
  // These are stored as ISO date strings in the DB, but are date objects everywhere else
  startDate: Date;
  endDate?: Date; // competition-only
  timezone?: string; // meetup-only; not needed on creation
  organizers: IPerson[]; // stored as references
  contact?: string;
  description: string;
  competitorLimit?: number; // required for competitions
  events: IContestEvent[];
  participants: number;
  queuePosition?: number; // optional, used for the queue feature
  // IMPORTANT: this is not set when importing a competition and must be set manually by an admin
  compDetails?: ICompetitionDetails; // competition-only
  meetupDetails?: IMeetupDetails; // meetup-only
}

export type IContestDto = Omit<
  IContest,
  'createdBy' | 'state' | 'participants'
>;

// IMPORTANT: if this is ever to be changed, pay attention to the updateContestEvents function in the contests service
export interface IContestEvent {
  event: IEvent; // stored as a reference
  rounds: IRound[]; // stored as references
}

export interface ICompetitionDetails {
  schedule: ISchedule; // stored as a reference
}

export interface IMeetupDetails {
  startTime: Date; // start time in UTC
}

// CONTEST DATA (just used for sending full contest information to the frontend)
export interface IContestData {
  contest: IContest;
  persons: IPerson[]; // info about competitors who competed in this contest
  activeRecordTypes: IRecordType[];
  recordPairsByEvent?: IEventRecordPairs[]; // only set if contest data is requested by a moderator
  creator?: IFeUser; // THIS IS ADMIN-ONLY!
}
