import { WcaRecordType } from '../enums';
import { ICompetition, IEvent, IPerson, IRecordType } from '../interfaces';

export interface IResult {
  competitionId?: string; // not needed for submitted results
  eventId: string;
  date: Date;
  compNotPublished?: boolean; // unset by default, set if true
  // This is an array, because for team events (e.g. Team-Blind) it stores multiple IDs
  personIds: number[];
  ranking?: number; // not needed for submitted results
  // Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
  // For FMC it's the number of moves. For MBLD it works completely differently (will be added later).
  attempts: number[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
  regionalSingleRecord?: string;
  regionalAverageRecord?: string;
  videoLink?: string; // only used for submission-based events
  discussionLink?: string; // only used for submission-based events
}

export interface IRanking {
  type: 'single' | 'average' | 'mean';
  result: IResult;
  persons: IPerson[];
  competition: ICompetition;
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
