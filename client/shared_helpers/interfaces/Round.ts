import { IResult } from '../interfaces';
import { RoundFormat, RoundType, RoundProceed } from '../enums';

export interface IProceed {
  type: RoundProceed;
  value: number; // number of people proceeding or % of people proceeding
}

export interface IRound {
  roundId: string; // the round identifier of the form {eventId}-r{round number} (also a valid activity code)
  competitionId: string;
  roundTypeId: RoundType; // first/second/semi/finals
  format: RoundFormat;
  // This is only set if it's not the final round
  proceed?: IProceed;
  results: IResult[]; // this is an empty array until results are posted
}
