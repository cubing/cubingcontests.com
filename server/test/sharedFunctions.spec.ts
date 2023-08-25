import { compareAvgs, setNewRecords } from '@sh/sharedFunctions';
import { IRecordPair, IResult } from '@sh/interfaces';
import { WcaRecordType } from '../../client/shared_helpers/enums';
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

describe('setNewRecords', () => {
  const mock333RecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 1000,
      average: 1100,
    },
  ];

  const mock222RecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 236,
      average: 369,
    },
  ];

  const mockBLDRecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 2217,
      average: 2795,
    },
  ];

  const mockFMRecordPairs = (): IRecordPair[] => [
    {
      wcaEquivalent: WcaRecordType.WR,
      best: 39,
      average: 4600,
    },
  ];

  it('sets new 3x3x3 records correctly', async () => {
    const rounds = setNewRecords(newCompetitionEventsStub()[0].rounds, mock333RecordPairs());

    // 6.86 single and 8.00 average WRs
    expect(rounds[0].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[0].results[0].regionalSingleRecord).toBe('WR');
  });

  it('sets multiple 2x2x2 records set in different rounds on the same day correctly', async () => {
    const rounds = setNewRecords(newFakeCompetitionEventsStub()[0].rounds, mock222RecordPairs());

    // The single here is also better than WR, but it should not be set,
    // because the next round has an even better single
    expect(rounds[0].results[0].regionalSingleRecord).toBeUndefined();
    expect(rounds[0].results[0].regionalAverageRecord).toBeUndefined();
    expect(rounds[1].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[1].results[0].regionalAverageRecord).toBe('WR');
  });

  it('sets new 3x3x3 FM records with multiple record-breaking results on the same day correctly', async () => {
    const rounds = setNewRecords(newCompetitionEventsStub()[1].rounds, mockFMRecordPairs());

    // 32 single and 35.67 mean WRs
    expect(rounds[0].results[0].regionalSingleRecord).toBeUndefined();
    expect(rounds[0].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[0].results[2].regionalSingleRecord).toBe('WR');
  });

  it('sets new 3x3x3 FM records with multiple rounds across multiple days and with ties correctly', async () => {
    const rounds = setNewRecords(newFakeCompetitionEventsStub()[1].rounds, mockFMRecordPairs());

    const singleRecord333fmResults: IResult[] = [];
    const avgRecord333fmResults: IResult[] = [];

    // Get 3x3x3 FM results with records
    for (const round of rounds) {
      for (const result of round.results) {
        if (result.regionalSingleRecord) singleRecord333fmResults.push(result);
        if (result.regionalAverageRecord) avgRecord333fmResults.push(result);
      }
    }

    expect(singleRecord333fmResults.length).toBe(3);
    expect(avgRecord333fmResults.length).toBe(2);

    expect(rounds[0].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[0].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[0].results[1].regionalSingleRecord).toBe('WR');
    expect(rounds[0].results[1].regionalAverageRecord).toBeUndefined();
    // Rounds 2 and 3 were on the same day and both had better results than the records set the day before
    expect(rounds[1].results[0].regionalSingleRecord).toBeUndefined();
    expect(rounds[1].results[0].regionalAverageRecord).toBeUndefined();
    expect(rounds[2].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[2].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[3].results[0].regionalSingleRecord).toBeUndefined();
    expect(rounds[3].results[0].regionalAverageRecord).toBeUndefined();
  });

  it('sets new 3x3x3 FM records with multiple same-day rounds with ties correctly', () => {
    const rounds = setNewRecords(sameDayFMRoundsStub(), mockFMRecordPairs());

    expect(rounds[0].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[0].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[1].results[0].regionalSingleRecord).toBeUndefined();
    expect(rounds[1].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[1].results[1].regionalSingleRecord).toBe('WR');
    expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
  });

  it('updates 3x3x3 BLD single record correctly', async () => {
    const rounds = setNewRecords(newFakeCompetitionEventsStub()[2].rounds, mockBLDRecordPairs());

    expect(rounds[0].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[0].results[0].regionalAverageRecord).toBeUndefined();
    expect(rounds[0].results[1].regionalSingleRecord).toBeUndefined();
    expect(rounds[0].results[1].regionalAverageRecord).toBe('WR');
  });

  it('sets new 3x3x3 BLD records from multiple same-day rounds correctly', () => {
    const rounds = setNewRecords(sameDayBLDRoundsStub(), mockBLDRecordPairs());

    // Expect new records to be set, but only for the best results of the day
    expect(rounds[0].results.find((el) => el.regionalSingleRecord || el.regionalAverageRecord)).toBeUndefined();
    expect(rounds[1].results[0].regionalSingleRecord).toBe('WR');
    expect(rounds[1].results[0].regionalAverageRecord).toBe('WR');
    expect(rounds[1].results[1].regionalSingleRecord).toBeUndefined();
    expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
  });
});
