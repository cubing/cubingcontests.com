import { WcaRecordType } from '../enums';
import { ICompetition, IEvent, IPerson, IRecordType } from '../interfaces';

export interface IAttempt {
  /**
   * Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
   * For FMC it's the number of moves. For MBLD it works completely differently:
   * https://www.worldcubeassociation.org/export/results
   *
   * The difference is that CC allows multi results up to 9999 cubes instead of 99,
   * time is stored as centiseconds, and it stores DNFs with all of the same information (e.g. DNF (5/12 52:13))
   * (they're just stored as negative numbers).
   */
  result: number;
  memo?: number; // memorization time in centiseconds (optional and only used for BLD events)
}

export interface IResult {
  competitionId?: string; // not needed for submitted results
  eventId: string;
  date: Date;
  unapproved?: boolean; // undefined by default, set if true
  // This is an array, because for team events (e.g. Team-Blind) it stores multiple IDs
  personIds: number[];
  ranking?: number; // not needed for submitted results
  attempts: IAttempt[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
  regionalSingleRecord?: string;
  regionalAverageRecord?: string;
  videoLink?: string; // only used for submission-based events
  discussionLink?: string; // only used for submission-based events
}

export interface IRanking {
  type?: 'single' | 'average' | 'mean'; // only set for the records page
  ranking?: number; // only set for the rankings page
  persons: IPerson[];
  resultId: string;
  result: number; // either the single time or the average time
  attemptNumber?: number; // only set for top single results rankings
  memo?: number; // only set for top single results rankings for events with the HasMemo group
  date: Date;
  competition?: ICompetition; // optional, because not all results have a competition
  attempts?: IAttempt[]; // only set for the average and mean ranking type
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
  events: IEvent[]; // these must only be submission-based events
  recordPairsByEvent: IEventRecordPairs[];
  activeRecordTypes: IRecordType[];
}
