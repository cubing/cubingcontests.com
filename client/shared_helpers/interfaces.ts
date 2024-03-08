export type { IContest, IContestEvent, IContestData, ICompetitionDetails, IMeetupDetails } from './interfaces/Contest';
export type { IEvent } from './interfaces/Event';
export type { IEventRule } from './interfaces/EventRule';
export type { IPerson, IDtoPerson } from './interfaces/Person';
export type { IRecordType } from './interfaces/RecordType';
export type {
  IResult,
  IAttempt,
  IRanking,
  IEventRankings,
  IRecordPair,
  IEventRecordPairs,
  IResultsSubmissionInfo,
} from './interfaces/Result';
export type { IRound, ITimeLimit, ICutoff, IProceed } from './interfaces/Round';
export type { ISchedule, IVenue, IRoom, IActivity } from './interfaces/Schedule';
export type { IAdminStats } from './interfaces/AdminStats';

export type {
  Competition as IWcifCompetition,
  Event as IWcifEvent,
  Round as IWcifRound,
  Schedule as IWcifSchedule,
  Activity as IWcifActivity,
} from '@wca/helpers';

export type { IFrontendUser } from './interfaces/frontend/User';
export type { IFrontendResult } from './interfaces/frontend/Result';
export type { IFrontendEvent } from './interfaces/frontend/Event';
