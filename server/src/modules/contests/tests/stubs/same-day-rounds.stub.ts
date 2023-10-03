import { RoundDocument } from '~/src/models/round.model';
import { RoundFormat, RoundType, WcaRecordType } from '@sh/enums';

export const sameDayBLDRoundsStub = (): RoundDocument[] => {
  return [
    {
      roundId: '333bf-r1',
      competitionId: 'BLDTestComp2023',
      date: new Date('2023-07-01T00:00:00Z'),
      roundTypeId: RoundType.First,
      format: RoundFormat.BestOf3,
      results: [
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [9],
          ranking: 1,
          attempts: [{ result: 2202 }, { result: 2960 }, { result: 3037 }],
          best: 2202, // better than previous WR, but not the best single of the day
          average: 2733, // better than previous WR, but not the best average of the day
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [8],
          ranking: 2,
          attempts: [{ result: 2371 }, { result: 2409 }, { result: 2769 }],
          best: 2371,
          average: 2516, // better than previous WR, but not the best single of the day
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [7],
          ranking: 3,
          attempts: [{ result: -1 }, { result: 4006 }, { result: -1 }],
          best: 4006,
          average: -1,
        },
      ],
    },
    {
      roundId: '333bf-r1',
      competitionId: 'BLDTestComp2023',
      date: new Date('2023-07-01T00:00:00Z'),
      roundTypeId: RoundType.Final,
      format: RoundFormat.BestOf3,
      results: [
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [8],
          ranking: 1,
          attempts: [{ result: 2098 }, { result: 2372 }, { result: 2534 }],
          best: 2098, // new single WR
          average: 2335, // new mean WR
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [9],
          ranking: 2,
          attempts: [{ result: 3609 }, { result: -1 }, { result: 2940 }],
          best: 2940,
          average: -1,
        },
      ],
    },
  ] as RoundDocument[];
};

export const sameDayFMRoundsStub = (): RoundDocument[] => {
  return [
    {
      roundId: '333fm-r1',
      competitionId: 'FMTestComp2023',
      date: new Date('2023-07-01T00:00:00Z'),
      roundTypeId: RoundType.First,
      format: RoundFormat.Mean,
      results: [
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [9],
          ranking: 1,
          attempts: [{ result: 44 }, { result: 39 }, { result: 46 }],
          best: 39, // WR tied with the record and with another single in the finals
          average: 4300, // new WR, but tied with another mean in the finals
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [8],
          ranking: 2,
          attempts: [{ result: 46 }, { result: 47 }, { result: 48 }],
          best: 47,
          average: 4700,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [7],
          ranking: 3,
          attempts: [{ result: 44 }, { result: -1 }, { result: -2 }],
          best: 44,
          average: -1,
        },
      ],
    },
    {
      roundId: '333fm-r1',
      competitionId: 'FMTestComp2023',
      date: new Date('2023-07-01T00:00:00Z'),
      roundTypeId: RoundType.Final,
      format: RoundFormat.Mean,
      results: [
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [8],
          ranking: 1,
          attempts: [{ result: 41 }, { result: 43 }, { result: 45 }],
          best: 41,
          average: 4300, // new WR, but tied with another mean in the first round
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T00:00:00Z'),
          personIds: [9],
          ranking: 2,
          attempts: [{ result: 39 }, { result: -1 }, { result: -2 }],
          best: 39, // WR tied with the record and with another single in the first round
          average: -1,
        },
      ],
    },
  ] as RoundDocument[];
};
