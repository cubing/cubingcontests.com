import IResult from './interfaces/Result';

export const compareSingles = (a: IResult, b: IResult): number => {
  if (a.best <= 0 && b.best > 0) return 1;
  else if (a.best > 0 && b.best <= 0) return -1;
  return a.best - b.best;
};

export const compareAvgs = (a: IResult, b: IResult): number => {
  if (a.average <= 0 && b.average > 0) return 1;
  else if (a.average > 0 && b.average <= 0) return -1;
  return a.average - b.average;
};
