import { roundsStub } from '@m/competitions/tests/stubs/rounds.stub';

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// THIS IS ALL OLD CODE THAT NEEDS TO BE REWRITTEN!!!
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export const mockRecordTypeModel = {
  create: jest.fn(),
  find(query: any) {
    const typeKey = query.split('.')[1];

    return {
      sort() {
        return {
          limit() {
            return roundsStub().sort((a, b) => {
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
