import { EventId, RoundFormatId, RegionalRecord } from '../types';

interface IResult {
  personId: string; // reference to person in the database
  competitionId: string; // reference to competition in the database
  ranking: number;
  eventId: EventId;
  formatId: RoundFormatId;
  // roundTypeId ???????????????????????
  // Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
  // For FMC it's the number of moves. For MBLD it works completely differently (will be added later).
  attempts: number[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
  regionalSingleRecord: RegionalRecord;
  regionalAverageRecord: RegionalRecord;
}

export default IResult;
