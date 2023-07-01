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
              // Both single and average should be the new XWRs
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
              // The mean should be the new XWR
              average: 3567,
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
              // The single should be the new XWR
              best: 32,
              average: -1,
            },
          ],
        },
      ],
    },
  ];
};
