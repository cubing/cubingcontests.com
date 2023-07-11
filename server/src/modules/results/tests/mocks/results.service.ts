import { ResultDocument } from '~/src/models/result.model';
import { resultsStub } from '../stubs/results.stub';

export const ResultsServiceMock = (): any => ({
  async getEventSingleRecordResults(
    eventId: string,
    recordLabel: string,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    let results: ResultDocument[] = resultsStub().filter(
      (el) => el.eventId === eventId && el.regionalSingleRecord === recordLabel,
    );

    if (beforeDate) results = results.filter((el) => el.date < beforeDate);
    results = results.sort((a: ResultDocument, b: ResultDocument) => b.date.getTime() - a.date.getTime()).slice(0, 1);

    return results;
  },
  async getEventAverageRecordResults(
    eventId: string,
    recordLabel: string,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    let results: ResultDocument[] = resultsStub().filter(
      (el) => el.eventId === eventId && el.regionalAverageRecord === recordLabel,
    );

    if (beforeDate) results = results.filter((el) => el.date < beforeDate);
    results = results.sort((a: ResultDocument, b: ResultDocument) => b.date.getTime() - a.date.getTime()).slice(0, 1);

    return results;
  },
});
