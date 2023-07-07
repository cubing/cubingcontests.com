import { IResult } from './interfaces/Result';

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
    if (b.average <= 0) return compareSingles(a, b);
    return 1;
  } else if (a.average > 0 && b.average <= 0) return -1;
  return a.average - b.average;
};
