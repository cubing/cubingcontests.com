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

    // Sort by date
    results.sort((a: ResultDocument, b: ResultDocument) => b.date.getTime() - a.date.getTime());
    // Only keep the records that tie the most recent one
    results = results.filter((el) => el.best === results[0].best);

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

    // Sort by date
    results.sort((a: ResultDocument, b: ResultDocument) => b.date.getTime() - a.date.getTime()).slice(0, 1);
    // Only keep the records that tie the most recent one
    results = results.filter((el) => el.average === results[0].average);

    return results;
  },
});
