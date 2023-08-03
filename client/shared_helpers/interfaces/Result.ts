import { IEvent } from './Event';
import { IPerson } from './Person';

export interface IResult {
  _id?: unknown; // not needed during creation; used by the frontend
  competitionId: string;
  eventId: string;
  date: Date;
  compNotPublished?: boolean; // unset by default, set if true
  // This is a string, because for team events (e.g. Team BLD) it stores multiple ids (e.g. "3;14;15")
  personId: string;
  ranking: number;
  // Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
  // For FMC it's the number of moves. For MBLD it works completely differently (will be added later).
  attempts: number[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
  regionalSingleRecord?: string;
  regionalAverageRecord?: string;
}

export interface IEventRecords {
  event: IEvent;
  bestRecords: {
    result: IResult;
    persons: IPerson[];
  }[];
  averageRecords: {
    result: IResult;
    persons: IPerson[];
  }[];
}
