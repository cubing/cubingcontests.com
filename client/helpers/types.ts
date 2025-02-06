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
  ICreateResultDto,
  ICreateVideoBasedResultDto,
  IEventRankings,
  IEventRecordPairs,
  IFeAttempt,
  IFeResult,
  IRanking,
  IRecordPair,
  IResult,
  IResultsSubmissionInfo,
  IUpdateResultDto,
  IUpdateVideoBasedResultDto,
  IVideoBasedResult,
} from "./interfaces/Result.ts";
export type { ICutoff, IProceed, IRound, IRoundFormat, ITimeLimit } from "./interfaces/Round.ts";
export type { IActivity, IRoom, ISchedule, IVenue } from "./interfaces/Schedule.ts";
export type { IAdminStats } from "./interfaces/AdminStats.ts";
export type { INavigationItem } from "./interfaces/NavigationItem.ts";
export type { IAuthToken } from "./interfaces/AuthToken.ts";
export type { IJwtPayload } from "./interfaces/JwtPayload.ts";
export type { IFeUser, IPartialUser, IUser } from "./interfaces/User.ts";

// Types
export type { Event, FeEvent } from "./types/Event.ts";
export type { CollectiveSolution, FeCollectiveSolution, IMakeMoveDto } from "./types/CollectiveSolution.ts";
export type { NxNMove } from "./types/NxNMove.ts";
export { nxnMoves } from "./types/NxNMove.ts";
export type { InputPerson } from "./types/InputPerson.ts";
export type { MultiChoiceOption } from "./types/MultiChoiceOption.ts";
export type { UserInfo } from "./types/UserInfo.ts";
export type { EventCategory } from "./types/EventCategory.ts";
export type { FetchObj } from "./types/FetchObj.ts";
export type { HttpMethod } from "./types/HttpMethod.ts";

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

export type PageSize = "A4" | "A6";

export type ListPageMode = "view" | "add" | "edit";

// undefined is the empty value, null is the invalid value
export type NumberInputValue = number | null | undefined;
