import { IResult } from './Result';
import { RoundFormat, RoundType, RoundProceed } from '../enums';

export interface IProceed {
  type: RoundProceed;
  value: number; // number of people proceeding or % of people proceeding
}

export interface IRound {
  _id?: unknown; // not needed during creation; used by the frontend
  competitionId: string;
  eventId: string;
  date: Date;
  compNotPublished?: boolean; // unset by default, set if true
  roundTypeId: RoundType; // first/second/semi/finals
  format: RoundFormat;
  // This is only set if it's not the final round
  proceed?: IProceed;
  results: IResult[]; // this is an empty array until results are posted
}
