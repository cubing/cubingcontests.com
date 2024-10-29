import { RoundFormat, RoundType } from '~/shared_helpers/enums.ts';
import { IContestEvent, type IEvent } from '~/shared_helpers/types.ts';
import { eventsStub } from './events.stub.ts';

const eventsSeed = eventsStub();

export const newContestEventsStub = (): IContestEvent[] => {
  return [
    {
      event: eventsSeed.find((el) => el.eventId === '333') as IEvent,
      rounds: [
        {
          roundId: '333-r1',
          competitionId: 'Munich30062023',
          roundTypeId: RoundType.Final,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [9],
              ranking: 1,
              attempts: [{ result: 876 }, { result: 989 }, { result: 812 }, { result: 711 }, { result: 686 }],
              // Both single and average should be WRs
              best: 686,
              average: 800,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [1],
              ranking: 2,
              attempts: [{ result: 1366 }, { result: 1153 }, { result: 1106 }, { result: 1165 }, { result: 1206 }],
              best: 1106,
              average: 1175,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [4],
              ranking: 3,
              attempts: [{ result: 1473 }, { result: 1122 }, { result: 1281 }, { result: 995 }, { result: 1366 }],
              best: 995,
              average: 1256,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [8],
              ranking: 4,
              attempts: [{ result: 1463 }, { result: 2571 }, { result: 1370 }, { result: 2124 }, { result: 1632 }],
              best: 1370,
              average: 1740,
            },
          ],
        },
      ],
    },
    {
      event: eventsSeed.find((el) => el.eventId === '333fm') as IEvent,
      rounds: [
        {
          roundId: '333fm-r1',
          competitionId: 'Munich30062023',
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [9],
              ranking: 1,
              attempts: [{ result: 37 }, { result: 34 }, { result: 36 }],
              best: 34,
              average: 3567, // the mean should be the new WR
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [4],
              ranking: 2,
              attempts: [{ result: 49 }, { result: 46 }, { result: 46 }],
              best: 46,
              average: 4700,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T00:00:00Z'),
              personIds: [1],
              ranking: 3,
              attempts: [{ result: -1 }, { result: -1 }, { result: 32 }],
              best: 32, // the single should be the new WR
              average: -1,
            },
          ],
        },
      ],
    },
  ];
};

export const newFakeContestEventsStub = (): IContestEvent[] => {
  return [
    {
      event: eventsSeed.find((el) => el.eventId === '222') as IEvent,
      rounds: [
        {
          roundId: '222-r1',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.First,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [100],
              ranking: 1,
              attempts: [{ result: 372 }, { result: 389 }, { result: 149 }, { result: 299 }, { result: 361 }],
              // The single is better than WR, but the next round on the same day has an even better result
              best: 149,
              average: 344,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [101],
              ranking: 2,
              attempts: [{ result: 531 }, { result: 398 }, { result: 422 }, { result: 601 }, { result: 437 }],
              best: 398,
              average: 463,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [102],
              ranking: 3,
              attempts: [{ result: 678 }, { result: 922 }, { result: 301 }, { result: 529 }, { result: 746 }],
              best: 301,
              average: 651,
            },
          ],
        },
        {
          roundId: '222-r2',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.Final,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [100],
              ranking: 1,
              attempts: [{ result: 299 }, { result: 314 }, { result: 562 }, { result: 135 }, { result: 212 }],
              // The single and average should be the new WRs
              best: 135,
              average: 275,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [101],
              ranking: 2,
              attempts: [{ result: 408 }, { result: 332 }, { result: 569 }, { result: 420 }, { result: 421 }],
              best: 332,
              average: 416,
            },
          ],
        },
        {
          roundId: '222-r3',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [100],
              ranking: 1,
              attempts: [{ result: 100 }, { result: 101 }, { result: 102 }],
              // The single should be the new WR, the average shouldn't, cause this is Mo3
              best: 100,
              average: 101,
            },
          ],
        },
      ],
    },
    {
      event: eventsSeed.find((el) => el.eventId === '333fm') as IEvent,
      rounds: [
        {
          roundId: '333fm-r1',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.First,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [999],
              ranking: 1,
              attempts: [{ result: 29 }, { result: 30 }, { result: 34 }],
              // The single and mean should both be WRs
              best: 29,
              average: 3100,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [998],
              ranking: 2,
              attempts: [{ result: -1 }, { result: 29 }, { result: -2 }],
              best: 29, // the single should be the new WR (tied)
              average: -1,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [100],
              ranking: 3,
              attempts: [{ result: 42 }, { result: -2 }, { result: -2 }],
              best: 42,
              average: -1,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [997],
              ranking: 4,
              attempts: [{ result: 61 }, { result: -1 }, { result: -2 }],
              best: 61,
              average: -1,
            },
          ],
        },
        // DIFFERENT DAY
        {
          roundId: '333fm-r2',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.Second,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'),
              personIds: [998],
              ranking: 1,
              attempts: [{ result: 30 }, { result: 29 }, { result: 31 }],
              // these are not WRs, because they get broken on the same day below
              best: 29,
              average: 3000,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'), // different time to throw a wrench in it
              personIds: [999],
              ranking: 2,
              attempts: [{ result: 38 }, { result: 32 }, { result: 44 }],
              best: 32,
              average: 3800,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'), // different time to throw a wrench in it
              personIds: [100],
              ranking: 3,
              attempts: [{ result: 41 }, { result: -1 }, { result: -2 }],
              best: 41,
              average: -1,
            },
          ],
        },
        // Same day (earlier time, which should be irrelevant)
        {
          roundId: '333fm-r3',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.Semi,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'),
              personIds: [998],
              ranking: 1,
              attempts: [{ result: 29 }, { result: 28 }, { result: 31 }],
              // The single and mean should both be WRs
              best: 28,
              average: 2933,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'),
              personIds: [999],
              ranking: 2,
              attempts: [{ result: 34 }, { result: 30 }, { result: 32 }],
              best: 30,
              average: 3200,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T00:00:00Z'),
              personIds: [100],
              ranking: 3,
              attempts: [{ result: 43 }, { result: -2 }, { result: -2 }],
              best: 43,
              average: -1,
            },
          ],
        },
        // DIFFERENT DAY (no records)
        {
          roundId: '333fm-r4',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-03T00:00:00Z'),
              personIds: [998],
              ranking: 1,
              attempts: [{ result: 33 }, { result: 31 }, { result: 33 }],
              best: 31,
              average: 3233,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-03T00:00:00Z'),
              personIds: [999],
              ranking: 2,
              attempts: [{ result: 35 }, { result: 32 }, { result: -1 }],
              best: 32,
              average: -1,
            },
          ],
        },
      ],
    },
    {
      event: eventsSeed.find((el) => el.eventId === '333bf') as IEvent,
      rounds: [
        {
          roundId: '333bf-r1',
          competitionId: 'TestComp2023',
          roundTypeId: RoundType.First,
          format: RoundFormat.BestOf3,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [998],
              ranking: 2,
              attempts: [{ result: -1 }, { result: 1976 }, { result: -1 }],
              best: 1976, // the single should be the new WR
              average: -1,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T00:00:00Z'),
              personIds: [999],
              ranking: 1,
              attempts: [{ result: 2217 }, { result: 3564 }, { result: 2604 }],
              best: 2217,
              average: 2795,
              regionalSingleRecord: 'WR', // this should be reset, because there is a better single now
              regionalAverageRecord: 'WR',
            },
          ],
        },
      ],
    },
  ];
};
