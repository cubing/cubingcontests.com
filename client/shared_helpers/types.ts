// Interfaces
export type {
  ICompetitionDetails,
  IContest,
  IContestData,
  IContestDto,
  IContestEvent,
  IMeetupDetails,
} from "./interfaces/Contest.ts";
export type { IEventRule } from "./interfaces/EventRule.ts";
export type { IFePerson, IPerson, IPersonDto, IWcaPersonDto } from "./interfaces/Person.ts";
export type { IRecordType } from "./interfaces/RecordType.ts";
export type {
  IAdminResultsSubmissionInfo,
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
  IVideoBasedResult,
} from "./interfaces/Result.ts";
export type { ICutoff, IProceed, IRound, IRoundFormat, ITimeLimit } from "./interfaces/Round.ts";
export type { IActivity, IRoom, ISchedule, IVenue } from "./interfaces/Schedule.ts";
export type { IFeUser } from "./interfaces/User.ts";
export type { IAdminStats } from "./interfaces/AdminStats.ts";

// Types
export type { IEvent, IFeEvent } from "./types/Event.ts";
export type { ICollectiveSolution, IFeCollectiveSolution, IMakeMoveDto } from "./types/CollectiveSolution.ts";
export type { ListPageMode } from "./types/ListPageMode.ts";
export type { HttpMethod } from "./types/HttpMethod.ts";
export type { FetchObj } from "./types/FetchObj.ts";
export type { NumberInputValue } from "./types/NumberInputValue.ts";
export type { NxNMove } from "./types/NxNMove.ts";

// WCIF types
export type {
  Activity as IWcifActivity,
  Competition as IWcifCompetition,
  Event as IWcifEvent,
  Round as IWcifRound,
  Schedule as IWcifSchedule,
} from "@wca/helpers";

// Random types

export type ResultRankingType = "single" | "average" | "mean";
