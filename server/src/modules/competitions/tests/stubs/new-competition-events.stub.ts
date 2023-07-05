import { RoundFormat, RoundType } from '@sh/enums';
import { ICompetitionEvent } from '@sh/interfaces/Competition';

export const newCompetitionEventsStub = (): ICompetitionEvent[] => {
  return [
    // Real results
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
    // Real results
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
    // Fake results
    {
      eventId: '333fm',
      rounds: [
        {
          competitionId: 'TestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T09:33:18Z'),
          roundTypeId: RoundType.Final,
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
              best: 29, // the single should be the new XWR
              average: -1,
            },
          ],
        },
      ],
    },
  ];
};
