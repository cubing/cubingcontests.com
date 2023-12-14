import { IResult } from '../interfaces';
import { RoundFormat, RoundType, RoundProceed } from '../enums';

export interface ITimeLimit {
  centiseconds: number;
  cumulativeRoundIds: string[];
}

export interface ICutoff {
  numberOfAttempts: number;
  attemptResult: number; // same as the result field in IAttempt (see Result.ts)
}

export interface IProceed {
  type: RoundProceed;
  value: number; // number of people proceeding or % of people proceeding
}

// IMPORTANT: when updating this, also pay attention to the updateContestEvents function in the contests service
export interface IRound {
  roundId: string; // the round identifier of the form {eventId}-r{round number} (also a valid activity code)
  competitionId: string;
  roundTypeId: RoundType; // first/second/semi/finals
  format: RoundFormat;
  // For these two fields the null value in WCIF corresponds to undefined in the DB to avoid storing unnecessary data
  timeLimit?: ITimeLimit; // this is undefined for all old comps (before 2023.12.14), even for events with Time format
  cutoff?: ICutoff;
  // This is only set if it's not the final round
  proceed?: IProceed;
  results: IResult[]; // this is an empty array until results are posted
}
