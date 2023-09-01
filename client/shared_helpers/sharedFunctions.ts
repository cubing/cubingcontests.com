import { RoundFormat, WcaRecordType } from './enums';
import { IResult, IRecordPair, IEvent } from './interfaces';
import { roundFormats } from './roundFormats';

// Returns >0 if a is worse than b, <0 if a is better than b, and 0 if it's a tie.
// This means that this function (and the one below) can be used in the Array.sort() method.
export const compareSingles = (a: IResult, b: IResult): number => {
  if (a.best <= 0 && b.best > 0) return 1;
  else if (a.best > 0 && b.best <= 0) return -1;
  return a.best - b.best;
};

// Same logic as above, except the single is also used as a tie-breaker if both averages are DNF.
// This tie-breaking behavior can be disabled with noTieBreaker = true (e.g. when setting records).
// However, that third argument cannot be used with the Array.sort() method.
export const compareAvgs = (a: IResult, b: IResult, noTieBreaker = false): number => {
  if (a.average <= 0) {
    if (b.average <= 0) {
      if (noTieBreaker) return 0;

      return compareSingles(a, b);
    }

    return 1;
  } else if (a.average > 0 && b.average <= 0) {
    return -1;
  }

  if (a.average === b.average && !noTieBreaker) return compareSingles(a, b);

  return a.average - b.average;
};

// IMPORTANT: it is assumed that recordPairs is sorted by importance (i.e. first WR, then the CRs, then NR, then PR)
export const setResultRecords = (result: IResult, recordPairs: IRecordPair[]): IResult => {
  for (const recordPair of recordPairs) {
    // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (recordPair.wcaEquivalent === WcaRecordType.WR) {
      const comparisonToRecordSingle = compareSingles(result, { best: recordPair.best } as IResult);

      if (result.best > 0 && comparisonToRecordSingle <= 0) {
        result.regionalSingleRecord = recordPair.wcaEquivalent;
      }

      const comparisonToRecordAvg = compareAvgs(result, { average: recordPair.average } as IResult, true);

      if (result.average > 0 && comparisonToRecordAvg <= 0) {
        result.regionalAverageRecord = recordPair.wcaEquivalent;
      }
    }
  }

  return result;
};

export const getDateOnly = (date: Date): Date => {
  if (!date) {
    console.error(`The date passed to getDateOnly is invalid: ${date}`);
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const getRoundCanHaveAverage = (roundFormat: RoundFormat, event: IEvent): boolean => {
  // Bo1 and Bo2 rounds cannot have an average
  const numberOfAttempts = roundFormats[roundFormat].attempts;
  if (numberOfAttempts < 3) return false;

  // If the default round format for the event is Ao5, but the number of attempts in the round
  // is less than five, the round cannot have an average
  if (numberOfAttempts < 5 && event.defaultRoundFormat === RoundFormat.Average) return false;

  return true;
};

export const getRoundRanksWithAverage = (roundFormat: RoundFormat, event: IEvent): boolean => {
  return [RoundFormat.Average, RoundFormat.Mean].includes(roundFormat) && getRoundCanHaveAverage(roundFormat, event);
};

export const fixTimesOverTenMinutes = (result: IResult) => {
  if (result.best > 60000) result.best -= result.best % 100;

  result.attempts = result.attempts.map((att) => (att > 60000 ? att - (att % 100) : att));
};
