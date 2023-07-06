import { IResult } from './Result';
import { RoundFormat, RoundType } from '../enums';

export interface IRound {
  competitionId: string;
  eventId: string;
  date: Date;
  roundTypeId: RoundType;
  format: RoundFormat;
  results: IResult[];
}
