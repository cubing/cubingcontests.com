import { rounds } from '@m/competitions/tests/stubs/rounds.stub';

export const mockRecordTypeModel = {
  create: jest.fn(),
  find(query: any) {
    const typeKey = query.split('.')[1];

    return {
      sort() {
        return {
          limit() {
            return rounds().sort((a, b) => {
              const aBest = (
                a.results.reduce((prev: any, curr: any) =>
                  curr[typeKey] > 0 && curr[typeKey] < prev[typeKey] ? curr : prev,
                ) as any
              )[typeKey];
              const bBest = (
                b.results.reduce((prev: any, curr: any) =>
                  curr[typeKey] > 0 && curr[typeKey] < prev[typeKey] ? curr : prev,
                ) as any
              )[typeKey];
              return aBest - bBest;
            });
          },
        };
      },
    };
  },
};
