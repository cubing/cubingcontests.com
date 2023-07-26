import { IResult } from './Result';
import { RoundFormat, RoundType, RoundProceed } from '../enums';

export interface IProceed {
  type: RoundProceed;
  value: number;
}

export interface IRound {
  _id?: unknown; // not needed during creation
  competitionId: string;
  eventId: string;
  date: Date;
  roundTypeId: RoundType; // first/second/semi/finals
  format: RoundFormat;
  // This is only set if it's not the final round
  proceed?: IProceed;
  results: IResult[]; // this is an empty array until results are posted
}
