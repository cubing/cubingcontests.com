import { compareAvgs, compareSingles, setResultRecords } from '@sh/sharedFunctions';
import { IRecordPair, IResult } from '@sh/interfaces';
import { WcaRecordType } from '@sh/enums';
import {
  newContestEventsStub,
  newFakeContestEventsStub,
} from '~/src/modules/competitions/tests/stubs/new-competition-events.stub';

describe('compareSingles', () => {
  it('compares singles correctly when a < b', () => {
    expect(compareSingles({ best: 10 } as IResult, { best: 11 } as IResult)).toBeLessThan(0);
  });

  it('compares singles correctly when a > b', () => {
    expect(compareSingles({ best: 10 } as IResult, { best: 9 } as IResult)).toBeGreaterThan(0);
  });

  it('compares singles correctly when a = b', () => {
    expect(compareSingles({ best: 10 } as IResult, { best: 10 } as IResult)).toBe(0);
  });

  it('compares singles correctly when a is DNF', () => {
    expect(compareSingles({ best: -1 } as IResult, { best: 10 } as IResult)).toBeGreaterThan(0);
  });

  it('compares singles correctly when b is DNF', () => {
    expect(compareSingles({ best: 10 } as IResult, { best: -1 } as IResult)).toBeLessThan(0);
  });

  it('compares singles correctly when a and b are DNF', () => {
    expect(compareSingles({ best: -1 } as IResult, { best: -1 } as IResult)).toBe(0);
  });

  it('compares singles correctly when a is DNS and b is DNF', () => {
    expect(compareSingles({ best: -2 } as IResult, { best: -1 } as IResult)).toBe(0);
  });

  it('compares singles correctly when a is DNF and b is DNS', () => {
    expect(compareSingles({ best: -1 } as IResult, { best: -2 } as IResult)).toBe(0);
  });

  describe('compare Multi-Blind singles', () => {
    it('compares Multi-Blind singles correctly when a is 2/2 and b is 9/10', () => {
      expect(
        compareSingles({ best: 999700043890000 } as IResult, { best: 999100774000001 } as IResult),
      ).toBeGreaterThan(0);
    });

    it('compares Multi-Blind singles correctly when a is 3/3 59.68 and b is 3/3 1:05.57', () => {
      expect(compareSingles({ best: 999600059680000 } as IResult, { best: 999600065570000 } as IResult)).toBeLessThan(
        0,
      );
    });

    it('compares Multi-Blind singles correctly when a is 51/55 58:06 and b is 49/51 58:06', () => {
      expect(
        compareSingles({ best: 995203486000004 } as IResult, { best: 995203486000002 } as IResult),
      ).toBeGreaterThan(0);
    });

    it('compares Multi-Blind singles correctly when a is DNF (6/15) and b is DNF (1/2)', () => {
      expect(compareSingles({ best: -999603161000009 } as IResult, { best: -999900516420001 } as IResult)).toBe(0);
    });
  });
});

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

describe('setResultRecords', () => {
  const mock333RecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 1000,
      average: 1100,
    },
  ];

  const mockBLDRecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 2217,
      average: 2795,
    },
  ];

  it('sets new 3x3x3 records correctly', async () => {
    const result = setResultRecords(newContestEventsStub()[0].rounds[0].results[0], mock333RecordPairs());

    // 6.86 single and 8.00 average WRs
    expect(result.regionalAverageRecord).toBe('WR');
    expect(result.regionalSingleRecord).toBe('WR');
  });

  it('updates 3x3x3 BLD single record correctly', async () => {
    const result = setResultRecords(newFakeContestEventsStub()[2].rounds[0].results[0], mockBLDRecordPairs());

    expect(result.regionalSingleRecord).toBe('WR');
    expect(result.regionalAverageRecord).toBeUndefined();
    // expect(rounds[0].results[1].regionalSingleRecord).toBeUndefined();
    // expect(rounds[0].results[1].regionalAverageRecord).toBe('WR');
  });
});
