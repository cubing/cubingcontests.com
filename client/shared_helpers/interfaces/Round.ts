import IResult from './Result';
import { RoundFormat, RoundType } from '../enums';

interface IRound {
  competitionId: string;
  eventId: string;
  date: Date;
  roundTypeId: RoundType;
  format: RoundFormat;
  results: IResult[];
}

export default IRound;
