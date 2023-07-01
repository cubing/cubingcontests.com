import { RoundDocument } from '~/src/models/round.model';
import { roundsStub } from '../stubs/rounds.stub';
import IRound from '@sh/interfaces/Round';

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// THIS IS ALL OLD CODE THAT NEEDS TO BE REWRITTEN!!!
//////////////////////////////////////////////////////////////////////////////////////////////////////////
export const mockRoundModel = (): any => ({
  // sortParams: undefined,
  // query: undefined,
  // otherQueryKey: '',
  // typeKey: '',

  create(round: IRound): RoundDocument {
    return round as RoundDocument;
  },
  // find(query: any) {
  //   this.query = query;
  //   // Get the other query key (result.regionalSingleRecord or result.regionalAverageRecord)
  //   this.otherQueryKey = Object.keys(this.query).find((el) => el !== 'eventId');
  //   // Get the part of that key after the dot
  //   this.typeKey = this.otherQueryKey.split('.')[1];

  //   // It's nested like this to make the currying work
  //   return this;
  // },
  // sort(sortParams: any) {
  //   this.sortParams = sortParams;
  //   return this;
  // },
  // async limit(count: number) {
  //   return rounds()
  //     .filter(
  //       (el: RoundDocument) =>
  //         el.eventId === this.query.eventId &&
  //         el.results.find((res: any) => res[this.typeKey] === this.query[this.otherQueryKey]),
  //     )
  //     .sort((a: any, b: any) => this.sortParams.date * (a.date - b.date))
  //     .slice(0, count);
  // },
});
