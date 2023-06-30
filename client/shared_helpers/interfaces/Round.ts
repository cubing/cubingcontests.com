import { RoundFormat, RoundType } from '../enums';

export interface IResult {
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

export interface IRound {
  competitionId: string;
  eventId: string;
  date: Date;
  roundTypeId: RoundType;
  format: RoundFormat;
  results: IResult[];
}

export default IRound;
