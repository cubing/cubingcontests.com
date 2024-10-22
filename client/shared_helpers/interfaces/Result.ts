import { WcaRecordType } from "../enums.ts";
import { IContest, IEvent, IFeUser, IPerson, IRecordType } from "../types.ts";

export interface IAttempt {
  /**
   * Number of centiseconds; 0 is a skipped attempt (e.g. when cutoff was not met) -1 is DNF, -2 is DNS,
   * C.maxTime is unknown time. For FMC it's the number of moves. For MBLD it works completely differently:
   * https://www.worldcubeassociation.org/export/results
   *
   * The difference is that CC allows multi results up to 9999 cubes instead of 99,
   * time is stored as centiseconds, and it stores DNFs with all of the same information (e.g. DNF (5/12 52:13))
   * (they're just stored as negative numbers).
   */
  result: number;
  memo?: number; // memorization time in centiseconds (optional and only used for BLD events)
}

// This allows null values for when the inputs are empty on the frontend
export interface IFeAttempt {
  result: number | null;
  memo?: number | null;
}

export interface IResult {
  competitionId?: string; // not needed for submitted results
  eventId: string;
  date: Date;
  unapproved?: true;
  // This is an array, because for team events (e.g. Team-Blind) it stores multiple IDs
  personIds: number[];
  ranking?: number; // not needed for submitted results
  attempts: IAttempt[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
  regionalSingleRecord?: string;
  regionalAverageRecord?: string;
  videoLink?: string; // required for submitted results (but admins may leave this empty)
  discussionLink?: string; // only used for submitted results (still optional though)
  createdBy?: unknown; // user ID of the user who created the result (only used for submitted results)
}

export interface IFeResult extends IResult {
  event: IEvent;
  persons: IPerson[];
}

export interface IUpdateResultDto {
  date: Date;
  unapproved?: true; // only needed for updating submitted results, because they can be approved at the same time
  personIds: number[];
  attempts: IAttempt[];
  videoLink?: string; // required for submitted results
  discussionLink?: string; // only used for submitted results
}

export interface IRanking {
  type?: "single" | "average" | "mean"; // only set for the records page
  ranking?: number; // only set for the rankings page
  persons: IPerson[];
  resultId: string;
  result: number; // either the single time or the average time
  attemptNumber?: number; // only set for top single results rankings
  memo?: number; // only set for single rankings for events with the HasMemo group
  date: Date;
  contest?: IContest; // optional, because some results are submitted, so they have no contest
  attempts?: IAttempt[]; // only set for the average and mean rankings
  videoLink?: string;
  discussionLink?: string;
}

// Used for storing rankings for a specific event
export interface IEventRankings {
  event: IEvent;
  rankings: IRanking[];
}

// Used for storing just the single/average record pairs for all record types for a specific event
export interface IRecordPair {
  wcaEquivalent: WcaRecordType;
  best: number;
  average: number;
}

export interface IEventRecordPairs {
  eventId: string;
  recordPairs: IRecordPair[];
}

export interface IResultsSubmissionInfo {
  events: IEvent[];
  recordPairsByEvent: IEventRecordPairs[];
  activeRecordTypes: IRecordType[];
  // These are only used for the edit result page, so this information is admin-only
  result?: IResult;
  persons?: IPerson[];
  creator?: IFeUser;
}
