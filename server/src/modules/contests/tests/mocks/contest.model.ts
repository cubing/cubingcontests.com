import { ContestDocument } from '~/src/models/contest.model';
import { competitionsStub } from '../stubs/competitions.stub';

export const CompetitionModelMock = (): any => ({
  tempOutput: undefined,
  find(query: any, selectObj: any) {
    this.tempOutput = competitionsStub();

    if (query?.countryIso2) {
      this.tempOutput = this.tempOutput.filter((el: ContestDocument) => el.countryIso2 === query.countryIso2);
    }
    if (query?.state) {
      this.tempOutput = this.tempOutput.filter((el: ContestDocument) => el.state > query.state.$gt);
    }

    // Exclude createdBy, if requested
    if (selectObj?.createdBy === 0) {
      this.tempOutput = this.tempOutput.map((el: ContestDocument) => {
        const { createdBy, ...rest } = el;
        return rest;
      });
    }

    return this;
  },
  // A search parameter value of 1 is for ascending order, -1 is for descending order
  sort(params: any) {
    if (params?.startDate)
      this.tempOutput.sort(
        (a: ContestDocument, b: ContestDocument) => params.rank * (a.startDate.getTime() - b.startDate.getTime()),
      );
    return this;
  },
  findOne(query: any) {
    if (query?.competitionId) {
      this.tempOutput = competitionsStub().find((el: ContestDocument) => el.competitionId === query.competitionId);
    }

    return this;
  },
  populate() {
    return this;
  },
  // Resets the temporary output and returns the document
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = undefined;

    // If the output is an array, return the array, otherwise return the single found
    // contest document with a save() method.
    if (typeof temp?.length === 'number') {
      return temp;
    } else {
      return { ...temp, async save() {} };
    }
  },
});
