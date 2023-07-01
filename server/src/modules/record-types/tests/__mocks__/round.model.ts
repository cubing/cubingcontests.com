import { RoundDocument } from '~/src/models/round.model';
import { rounds } from '@m/competitions/tests/stubs/rounds.stub';

export const mockRoundModel = {
  create: jest.fn(),
  find(query: any) {
    // Get the other query key (result.regionalSingleRecord or result.regionalAverageRecord)
    const otherQueryKey = Object.keys(query).find((el) => el !== 'eventId');
    // Get the part of that key after the dot
    const typeKey = otherQueryKey.split('.')[1];

    // It's nested like this to make the currying work
    return {
      sort(sortParams: any) {
        return {
          async limit(count: number) {
            return rounds()
              .filter(
                (el: RoundDocument) =>
                  el.eventId === query.eventId && el.results.find((res: any) => res[typeKey] === query[otherQueryKey]),
              )
              .sort((a: any, b: any) => sortParams.date * (a.date - b.date))
              .slice(0, count);
          },
        };
      },
    };
  },
};
