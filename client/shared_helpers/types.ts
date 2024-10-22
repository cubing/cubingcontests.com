// Interfaces
export type {
  ICompetitionDetails,
  IContest,
  IContestData,
  IContestDto,
  IContestEvent,
  IMeetupDetails,
} from "./interfaces/Contest.ts";
export type { IEventRule } from "./interfaces/EventRule";
export type { IFePerson, IPerson, IPersonDto, IWcaPersonDto } from "./interfaces/Person";
export type { IRecordType } from "./interfaces/RecordType";
export type {
  IAttempt,
  IEventRankings,
  IEventRecordPairs,
  IFeAttempt,
  IFeResult,
  IRanking,
  IRecordPair,
  IResult,
  IResultsSubmissionInfo,
  IUpdateResultDto,
} from "./interfaces/Result.ts";
export type { ICutoff, IProceed, IRound, ITimeLimit } from "./interfaces/Round";
export type { IActivity, IRoom, ISchedule, IVenue } from "./interfaces/Schedule";
export type { IFeUser } from "./interfaces/User";
export type { IAdminStats } from "./interfaces/AdminStats";

// Types
export type { IEvent, IFeEvent } from "./types/Event";
export type { ICollectiveSolution, IFeCollectiveSolution, IMakeMoveDto } from "./types/CollectiveSolution";
export type { ListPageMode } from "./types/ListPageMode";
export type { HttpMethod } from "./types/HttpMethod";
export type { FetchObj } from "./types/FetchObj";
export type { NumberInputValue } from "./types/NumberInputValue";
export type { NxNMove } from "./types/NxNMove";

// WCIF types
export type {
  Activity as IWcifActivity,
  Competition as IWcifCompetition,
  Event as IWcifEvent,
  Round as IWcifRound,
  Schedule as IWcifSchedule,
} from "@wca/helpers";
