import { RoundFormat, RoundType } from '@sh/enums';
import { ICompetitionEvent } from '@sh/interfaces/Competition';

export const newCompetitionEventsStub = (): ICompetitionEvent[] => {
  return [
    {
      eventId: '333',
      rounds: [
        {
          competitionId: 'Munich30062023',
          eventId: '333',
          date: new Date('2023-06-30T09:33:18Z'),
          roundTypeId: RoundType.Final,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '9',
              ranking: 1,
              attempts: [876, 989, 812, 711, 686],
              // Both single and average should be XWRs
              best: 686,
              average: 800,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '1',
              ranking: 2,
              attempts: [1366, 1153, 1106, 1165, 1206],
              best: 1106,
              average: 1175,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '4',
              ranking: 3,
              attempts: [1473, 1122, 1281, 995, 1366],
              best: 995,
              average: 1256,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '8',
              ranking: 4,
              attempts: [1463, 2571, 1370, 2124, 1632],
              best: 1370,
              average: 1740,
            },
          ],
        },
      ],
    },
    {
      eventId: '333fm',
      rounds: [
        {
          competitionId: 'Munich30062023',
          eventId: '333fm',
          date: new Date('2023-06-30T09:33:18Z'),
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '9',
              ranking: 1,
              attempts: [37, 34, 36],
              best: 34,
              average: 3567, // the mean should be the new XWR
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '4',
              ranking: 2,
              attempts: [49, 46, 46],
              best: 46,
              average: 4700,
            },
            {
              competitionId: 'Munich30062023',
              eventId: '333fm',
              date: new Date('2023-06-30T09:33:18Z'),
              personId: '1',
              ranking: 3,
              attempts: [-1, -1, 32],
              best: 32, // the single should be the new XWR
              average: -1,
            },
          ],
        },
      ],
    },
  ];
};

export const newFakeCompetitionEventsStub = (): ICompetitionEvent[] => {
  return [
    {
      eventId: '333fm',
      rounds: [
        {
          competitionId: 'TestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T09:33:18Z'),
          roundTypeId: RoundType.First,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '999',
              ranking: 1,
              attempts: [29, 30, 34],
              // The single and mean should both be XWRs
              best: 29,
              average: 3100,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '998',
              ranking: 2,
              attempts: [-1, 29, -2],
              best: 29, // the single should be the new XWR (tied)
              average: -1,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '100',
              ranking: 3,
              attempts: [42, -2, -2],
              best: 42,
              average: -1,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '997',
              ranking: 4,
              attempts: [61, -1, -2],
              best: 61,
              average: -1,
            },
          ],
        },
        {
          competitionId: 'TestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-02T09:33:18Z'), // DIFFERENT DAY
          roundTypeId: RoundType.Second,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T09:33:18Z'),
              personId: '998',
              ranking: 1,
              attempts: [29, 28, 31],
              // The single and mean should both be XWRs
              best: 28,
              average: 2933,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T09:33:18Z'),
              personId: '999',
              ranking: 2,
              attempts: [34, 30, 32],
              best: 30,
              average: 3200,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-02T09:33:18Z'),
              personId: '100',
              ranking: 3,
              attempts: [43, -2, -2],
              best: 43,
              average: -1,
            },
          ],
        },
        {
          competitionId: 'TestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-03T09:33:18Z'), // DIFFERENT DAY
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-03T09:33:18Z'),
              personId: '998',
              ranking: 1,
              attempts: [33, 31, 33],
              best: 31,
              average: 3233,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-03T09:33:18Z'),
              personId: '999',
              ranking: 2,
              attempts: [35, 32, -1],
              best: 32,
              average: -1,
            },
          ],
        },
      ],
    },
    {
      eventId: '222',
      rounds: [
        {
          competitionId: 'TestComp2023',
          eventId: '222',
          date: new Date('2023-07-01T09:33:18Z'),
          roundTypeId: RoundType.First,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '100',
              ranking: 1,
              attempts: [372, 389, 149, 299, 361],
              // The single is better than XWR, but the next round on the same day has an even better result
              best: 149,
              average: 344,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '101',
              ranking: 2,
              attempts: [531, 398, 422, 601, 437],
              best: 398,
              average: 463,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '102',
              ranking: 3,
              attempts: [678, 922, 301, 529, 746],
              best: 301,
              average: 651,
            },
          ],
        },
        {
          competitionId: 'TestComp2023',
          eventId: '222',
          date: new Date('2023-07-01T09:33:18Z'),
          roundTypeId: RoundType.Final,
          format: RoundFormat.Average,
          results: [
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '100',
              ranking: 1,
              attempts: [299, 314, 562, 135, 212],
              // The single and average should be the new XWRs
              best: 135,
              average: 275,
            },
            {
              competitionId: 'TestComp2023',
              eventId: '222',
              date: new Date('2023-07-01T09:33:18Z'),
              personId: '101',
              ranking: 2,
              attempts: [408, 332, 569, 420, 421],
              best: 332,
              average: 416,
            },
          ],
        },
      ],
    },
  ];
};
