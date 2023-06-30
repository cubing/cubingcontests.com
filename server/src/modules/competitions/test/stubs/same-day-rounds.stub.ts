import { RoundDocument } from '~/src/models/round.model';
import { RoundFormat, RoundType } from '@sh/enums';

export const sameDayRounds = (): RoundDocument[] => {
  return [
    {
      competitionId: 'TestComp2023',
      eventId: '333',
      date: new Date(),
      roundTypeId: RoundType.Final,
      format: RoundFormat.Average,
      results: [
        {
          personId: '1',
          ranking: 1,
          attempts: [1055, 1029, 1150, 1123, 1096],
          best: 1029,
          average: 1091, // This should be the new average XWR
        },
        {
          personId: '3',
          ranking: 2,
          attempts: [1492, 1244, 1399, 1520, 1264],
          best: 1244,
          average: 1385,
        },
        {
          personId: '2',
          ranking: 3,
          attempts: [1589, 1571, 1520, 1631, 1650],
          best: 1520,
          average: 1597,
        },
        {
          personId: '4',
          ranking: 4,
          attempts: [1923, 1984, 1809, 1593, 1912],
          best: 1593,
          average: 1881,
        },
      ],
    } as RoundDocument,
  ];
};
