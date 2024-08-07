// Interfaces
export type {
  IContest,
  IContestDto,
  IContestEvent,
  IContestData,
  ICompetitionDetails,
  IMeetupDetails,
} from './interfaces/Contest';
export type { IEventRule } from './interfaces/EventRule';
export type { IPerson, IPersonDto } from './interfaces/Person';
export type { IRecordType } from './interfaces/RecordType';
export type {
  IResult,
  IUpdateResultDto,
  IFeResult,
  IAttempt,
  IRanking,
  IEventRankings,
  IRecordPair,
  IEventRecordPairs,
  IResultsSubmissionInfo,
} from './interfaces/Result';
export type { IRound, ITimeLimit, ICutoff, IProceed } from './interfaces/Round';
export type { ISchedule, IVenue, IRoom, IActivity } from './interfaces/Schedule';
export type { IFeUser } from './interfaces/User';
export type { IAdminStats } from './interfaces/AdminStats';

// Types
export type { IEvent, IFeEvent } from './types/Event';
export type { ICollectiveSolution, IFeCollectiveSolution, IMakeMoveDto } from './types/CollectiveSolution';
export type { NxNMove } from './types/NxNMove';

// WCIF types
export type {
  Competition as IWcifCompetition,
  Event as IWcifEvent,
  Round as IWcifRound,
  Schedule as IWcifSchedule,
  Activity as IWcifActivity,
} from '@wca/helpers';
