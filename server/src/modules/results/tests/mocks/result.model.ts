import { ResultDocument } from '~/src/models/result.model';
import { IResult } from '@sh/types';
import { resultsStub } from '../stubs/results.stub';

export const ResultModelMock = (): any => ({
  tempOutput: undefined,
  create(results: IResult | IResult[]): ResultDocument | ResultDocument[] {
    if (Array.isArray(results)) {
      return results.map((result) => ({ ...result, save() {} })) as ResultDocument[];
    } else {
      return {
        ...results,
        save() {},
      } as ResultDocument;
    }
  },
  updateOne() {
    return this;
  },
  updateMany() {
    return this;
  },
  deleteMany() {
    return this;
  },
  aggregate() {
    this.tempOutput = [];
    return this;
  },
  find(query: any) {
    this.tempOutput = resultsStub();

    if (query?._id) {
      if (query._id.$ne)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el._id.toString() !== query._id.$ne);
      else this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el._id.toString() === query._id.toString());
    }
    if (query?.eventId) this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.eventId === query.eventId);
    if (query?.regionalSingleRecord) {
      this.tempOutput = this.tempOutput.filter(
        (el: ResultDocument) => el.regionalSingleRecord === query.regionalSingleRecord,
      );
    }
    if (query?.regionalAverageRecord) {
      this.tempOutput = this.tempOutput.filter(
        (el: ResultDocument) => el.regionalAverageRecord === query.regionalAverageRecord,
      );
    }
    if (query?.unapproved?.$exists === false) {
      this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.unapproved === undefined);
    }
    if (query?.date) {
      if (query.date.$lte) {
        this.tempOutput = this.tempOutput.filter(
          (el: ResultDocument) => el.date.getTime() <= query.date.$lte.getTime(),
        );
      }
    }
    if (query?.attempts) {
      if (query.attempts.$size !== undefined)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.attempts.length === query.attempts.$size);
    }
    if (query?.best) {
      if (query.best.$gt !== undefined)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.best > query.best.$gt);
      else if (query.best.$lte !== undefined)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.best <= query.best.$lte);
      else this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.best === query.best);
    }
    if (query?.average) {
      if (query.average.$gt !== undefined)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.average > query.average.$gt);
      else if (query.average.$lte !== undefined)
        this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.average <= query.average.$lte);
      else this.tempOutput = this.tempOutput.filter((el: ResultDocument) => el.average === query.average);
    }

    return this;
  },
  // A search parameter value of 1 is for ascending order, -1 is for descending order
  sort(params: any) {
    if (params?.date) {
      this.tempOutput.sort(
        (a: ResultDocument, b: ResultDocument) => params.date * (a.date.getTime() - b.date.getTime()),
      );
    } else if (params?.best) {
      this.tempOutput.sort((a: ResultDocument, b: ResultDocument) => params.best * (a.best - b.best));
    } else if (params?.average) {
      this.tempOutput.sort((a: ResultDocument, b: ResultDocument) => params.average * (a.average - b.average));
    }

    return this;
  },
  limit(count: number) {
    this.tempOutput = this.tempOutput.slice(0, count);
    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput || [];
    this.tempOutput = undefined;
    return temp;
  },
});
