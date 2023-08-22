import { RoundDocument } from '~/src/models/round.model';
import { RoundFormat, RoundType, WcaRecordType } from '@sh/enums';

export const sameDayBLDRoundsStub = (): RoundDocument[] => {
  return [
    {
      roundId: '333bf-r1',
      competitionId: 'BLDTestComp2023',
      date: new Date('2023-07-01T06:53:10Z'),
      roundTypeId: RoundType.First,
      format: RoundFormat.BestOf3,
      results: [
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [9],
          ranking: 1,
          attempts: [2202, 2960, 3037],
          best: 2202, // better than previous WR, but not the best result of the day
          average: 2733, // better than previous WR, but not the best result of the day
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [8],
          ranking: 2,
          attempts: [2371, 2409, 2769],
          best: 2371,
          average: 2516, // better than previous WR, but not the best result of the day
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [7],
          ranking: 3,
          attempts: [-1, 4006, -1],
          best: 4006,
          average: -1,
        },
      ],
    },
    {
      roundId: '333bf-r1',
      competitionId: 'BLDTestComp2023',
      date: new Date('2023-07-01T06:53:10Z'),
      roundTypeId: RoundType.Final,
      format: RoundFormat.BestOf3,
      results: [
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [8],
          ranking: 1,
          attempts: [2098, 2372, 2534],
          best: 2098, // new single WR
          average: 2335, // new mean WR
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [9],
          ranking: 2,
          attempts: [3609, -1, 2940],
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
      date: new Date('2023-07-01T06:53:10Z'),
      roundTypeId: RoundType.First,
      format: RoundFormat.Mean,
      results: [
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [9],
          ranking: 1,
          attempts: [44, 39, 46],
          best: 39, // WR tied with the record and with another single in the finals
          average: 4300, // new WR, but tied with another mean in the finals
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [8],
          ranking: 2,
          attempts: [46, 47, 48],
          best: 47,
          average: 4700,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [7],
          ranking: 3,
          attempts: [44, -1, -2],
          best: 44,
          average: -1,
        },
      ],
    },
    {
      roundId: '333fm-r1',
      competitionId: 'FMTestComp2023',
      date: new Date('2023-07-01T06:53:10Z'),
      roundTypeId: RoundType.Final,
      format: RoundFormat.Mean,
      results: [
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [8],
          ranking: 1,
          attempts: [41, 43, 45],
          best: 41,
          average: 4300, // new WR, but tied with another mean in the first round
          regionalAverageRecord: WcaRecordType.WR,
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          personIds: [9],
          ranking: 2,
          attempts: [39, -1, -2],
          best: 39, // WR tied with the record and with another single in the first round
          average: -1,
        },
      ],
    },
  ] as RoundDocument[];
};
