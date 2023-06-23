import { RoundFormat, RoundType } from '../enums';

interface IRound {
  // competitionId and eventId can be used to find where the round belongs
  competitionId: string; // reference to competition in the database
  eventId: string;
  number: number;
  formatId: RoundFormat;
  roundTypeId: RoundType;
  results: {
    personId: string; // reference to person in the database
    ranking: number;
    // Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
    // For FMC it's the number of moves. For MBLD it works completely differently (will be added later).
    attempts: number[];
    best: number;
    average: number; // for FMC it's 100 times the mean (to avoid decimals)
    regionalSingleRecord: string;
    regionalAverageRecord: string;
  }[];
}

export default IRound;
