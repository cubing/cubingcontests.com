import { compareAvgs, setResultRecords } from '@sh/sharedFunctions';
import { IRecordPair, IResult } from '@sh/interfaces';
import { WcaRecordType } from '@sh/enums';
import {
  newCompetitionEventsStub,
  newFakeCompetitionEventsStub,
} from '~/src/modules/competitions/tests/stubs/new-competition-events.stub';
import { sameDayBLDRoundsStub, sameDayFMRoundsStub } from '~/src/modules/competitions/tests/stubs/same-day-rounds.stub';

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
    const result = setResultRecords(newCompetitionEventsStub()[0].rounds[0].results[0], mock333RecordPairs());

    // 6.86 single and 8.00 average WRs
    expect(result.regionalAverageRecord).toBe('WR');
    expect(result.regionalSingleRecord).toBe('WR');
  });

  it('updates 3x3x3 BLD single record correctly', async () => {
    const result = setResultRecords(newFakeCompetitionEventsStub()[2].rounds[0].results[0], mockBLDRecordPairs());

    expect(result.regionalSingleRecord).toBe('WR');
    expect(result.regionalAverageRecord).toBeUndefined();
    // expect(rounds[0].results[1].regionalSingleRecord).toBeUndefined();
    // expect(rounds[0].results[1].regionalAverageRecord).toBe('WR');
  });
});
