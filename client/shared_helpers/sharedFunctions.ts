import { Color, WcaRecordType } from './enums';
import { IRound, IResult, IRecordType } from './interfaces';

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

// Sets new records in-place in the rounds array and returns that array
export const setNewRecords = (
  sameDayRounds: IRound[],
  records: { best: number; average: number },
  recordLabel: string,
  updateRecords = false, // whether or not to update the record object with new records
): IRound[] => {
  // Initialize arrays with dummy results
  let bestSingleResults = [{ best: -1 }] as IResult[];
  let bestAvgResults = [{ average: -1 }] as IResult[];

  for (const round of sameDayRounds) {
    for (const result of round.results) {
      // Reset the records for now
      delete result.regionalSingleRecord;
      delete result.regionalAverageRecord;

      const comparisonToBestSingle = compareSingles(result, bestSingleResults[0]);
      const comparisonToRecordSingle = compareSingles(result, records as IResult);

      if (comparisonToBestSingle <= 0 && comparisonToRecordSingle <= 0) {
        // If it's BETTER, reset the new records; if it's a TIE, add to the list
        if (comparisonToBestSingle < 0) {
          bestSingleResults = [result];
        } else {
          bestSingleResults.push(result);
        }
      }

      const comparisonToBestAvg = compareAvgs(result, bestAvgResults[0], true);
      const comparisonToRecordAvg = compareAvgs(result, records as IResult, true);

      if (comparisonToBestAvg <= 0 && comparisonToRecordAvg <= 0) {
        // If it's BETTER, reset the new records; if it's a TIE, add to the list
        if (comparisonToBestAvg < 0) {
          bestAvgResults = [result];
        } else {
          bestAvgResults.push(result);
        }
      }
    }
  }

  // If no records were set, this would still be -1
  if (bestSingleResults[0].best > 0) {
    if (updateRecords) records.best = bestSingleResults[0].best;

    bestSingleResults.forEach((res) => {
      console.log(`New ${res.eventId} single ${recordLabel} set: ${res.best}`);
      res.regionalSingleRecord = recordLabel;
    });
  }

  // If no records were set, this would still be -1
  if (bestAvgResults[0].average > 0) {
    if (updateRecords) records.average = bestSingleResults[0].average;

    bestAvgResults.forEach((res) => {
      console.log(`New ${res.eventId} average ${recordLabel} set: ${res.average}`);
      res.regionalAverageRecord = recordLabel;
    });
  }

  return sameDayRounds;
};
