import { compareAsc } from 'date-fns';
import { WcaRecordType } from './enums';
import { IRound, IResult } from './interfaces';
import { IRecordPair } from './interfaces/Result';

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

// Sets new records in-place in the rounds array and returns that array.
// IMPORTANT: it is assumed that recordPairs is sorted by importance (i.e. first WR, then the CRs, then NR, then PR)
export const setNewRecords = (rounds: IRound[], recordPairs: IRecordPair[]): IRound[] => {
  if (recordPairs.length === 0) return rounds;

  // Initialize with one empty day, because there is always going to be at least one
  const compDays: IRound[][] = [[]];
  let lastDate: Date = null;
  // All dates have to be converted, because they are passed in as ISO date strings
  const sortedRounds = [...rounds].sort((a, b) =>
    compareAsc(getDateOnly(new Date(a.date)), getDateOnly(new Date(b.date))),
  );

  // Firstly, separate all rounds by date (the time of the round is ignored); and reset records
  for (const round of sortedRounds) {
    const roundDate = getDateOnly(new Date(round.date));

    if (lastDate === null || roundDate.getTime() === lastDate.getTime()) {
      compDays[compDays.length - 1].push(round);
    } else {
      compDays.push([round]);
    }

    lastDate = roundDate;

    // Reset the records
    for (const result of round.results) {
      delete result.regionalSingleRecord;
      delete result.regionalAverageRecord;
    }
  }

  // Then set records for each day that had rounds
  for (const recordPair of recordPairs) {
    for (const compDay of compDays) {
      // Initialize results arrays with dummy results
      let bestSingleResults = [{ best: -1 }] as IResult[];
      let bestAvgResults = [{ average: -1 }] as IResult[];

      for (const round of compDay) {
        for (const result of round.results) {
          // TO-DO: MAKE SURE A PR/NR/CR DOES NOT OVERWRITE A NR/CR/WR

          if (recordPair.wcaEquivalent === WcaRecordType.WR) {
            const comparisonToBestSingle = compareSingles(result, bestSingleResults[0]);
            const comparisonToRecordSingle = compareSingles(result, { best: recordPair.best } as IResult);

            if (comparisonToBestSingle <= 0 && comparisonToRecordSingle <= 0) {
              // If it's BETTER, reset the new records; if it's a TIE, add to the list
              if (comparisonToBestSingle < 0) {
                bestSingleResults = [result];
              } else {
                bestSingleResults.push(result);
              }
            }

            const comparisonToBestAvg = compareAvgs(result, bestAvgResults[0], true);
            const comparisonToRecordAvg = compareAvgs(result, { average: recordPair.average } as IResult, true);

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
      }

      // If no records were set, the best results would still be -1

      if (bestSingleResults[0].best > 0) {
        for (const result of bestSingleResults) {
          console.log(`New ${result.eventId} single ${recordPair.wcaEquivalent} set: ${result.best}`);
          result.regionalSingleRecord = recordPair.wcaEquivalent;
        }

        // Update recordPair for the sake of the following competition days
        recordPair.best = bestSingleResults[0].best;
      }

      if (bestAvgResults[0].average > 0) {
        for (const result of bestAvgResults) {
          console.log(`New ${result.eventId} average ${recordPair.wcaEquivalent} set: ${result.average}`);
          result.regionalAverageRecord = recordPair.wcaEquivalent;
        }

        // Update recordPair for the sake of the following competition days
        recordPair.average = bestSingleResults[0].average;
      }
    }
  }

  return rounds;
};

export const getDateOnly = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
