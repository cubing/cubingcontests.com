import { ResultDocument } from '~/src/models/result.model';
import IResult from '@sh/interfaces/Result';
import { resultsStub } from '../stubs/results.stub';

export const mockResultModel = (): any => ({
  tempOutput: undefined,
  create(result: IResult): ResultDocument {
    return result as ResultDocument;
  },
  find(query: any) {
    this.tempOutput = resultsStub();

    if (query.eventId) {
      this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.eventId === query.eventId);
    }
    if (query.regionalSingleRecord) {
      this.tempOutput = this.tempOutput.filter(
        (el: ResultDocument) => el.regionalSingleRecord === query.regionalSingleRecord,
      );
    }
    if (query.regionalAverageRecord) {
      this.tempOutput = this.tempOutput.filter(
        (el: ResultDocument) => el.regionalAverageRecord === query.regionalAverageRecord,
      );
    }
    return this;
  },
  sort(sortParams: any) {
    // The date parameter is either 1 (ascending order) or -1 (descending order)
    if (sortParams.date) {
      this.tempOutput.sort(
        (a: ResultDocument, b: ResultDocument) => sortParams.date * (a.date.getTime() - b.date.getTime()),
      );
    }
    return this;
  },
  limit(count: number) {
    this.tempOutput = this.tempOutput.slice(0, count);
    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = null;
    return temp;
  },
});
