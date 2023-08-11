import { compareAvgs } from '@sh/sharedFunctions';
import { IResult } from '@sh/interfaces';

describe('compareAvgs', () => {
  it('compares averages correctly when a < b', () => {
    expect(compareAvgs({ average: 10 } as IResult, { average: 11 } as IResult)).toBeLessThan(0);
  });

  it('compares averages correctly when a > b', () => {
    expect(compareAvgs({ average: 10 } as IResult, { average: 9 } as IResult)).toBeGreaterThan(0);
  });

  it('compares averages correctly when b is DNF', () => {
    expect(compareAvgs({ average: 10 } as IResult, { average: -1 } as IResult)).toBeLessThan(0);
  });

  it('compares averages correctly when a is DNF', () => {
    expect(compareAvgs({ average: -1 } as IResult, { average: 10 } as IResult)).toBeGreaterThan(0);
  });

  it('compares averages correctly when a and b are DNF', () => {
    expect(compareAvgs({ average: -1, best: 10 } as IResult, { average: -1, best: 11 } as IResult)).toBeLessThan(0);
  });

  it('compares averages correctly when a and b are DNF and tie breakers are not needed', () => {
    expect(compareAvgs({ average: -1, best: 10 } as IResult, { average: -1, best: 11 } as IResult, true)).toBe(0);
  });

  it('compares same averages correctly when the singles are different', () => {
    expect(compareAvgs({ average: 10, best: 5 } as IResult, { average: 10, best: 6 } as IResult)).toBeLessThan(0);
  });

  it('compares same averages correctly when the singles are different and tie breakers are not needed', () => {
    expect(compareAvgs({ average: 10, best: 5 } as IResult, { average: 10, best: 6 } as IResult, true)).toBe(0);
  });

  it('compares same averages correctly when the singles are the same', () => {
    expect(compareAvgs({ average: 10, best: 5 } as IResult, { average: 10, best: 5 } as IResult)).toBe(0);
  });
});
