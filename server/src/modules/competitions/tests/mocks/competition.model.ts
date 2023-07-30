import { CompetitionDocument } from '~/src/models/competition.model';
import { competitionsStub } from '../stubs/competitions.stub';

export const mockCompetitionModel = (): any => ({
  tempOutput: undefined,
  find(query: any, selectObj: any) {
    this.tempOutput = competitionsStub();

    if (query?.countryId) {
      this.tempOutput = this.tempOutput.filter((el: CompetitionDocument) => el.countryId === query.countryId);
    }
    if (query?.state) {
      this.tempOutput = this.tempOutput.filter((el: CompetitionDocument) => el.state > query.state.$gt);
    }

    // Exclude createdBy, if requested
    if (selectObj?.createdBy === 0) {
      this.tempOutput = this.tempOutput.map((el: CompetitionDocument) => {
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
        (a: CompetitionDocument, b: CompetitionDocument) =>
          params.rank * (a.startDate.getTime() - b.startDate.getTime()),
      );
    return this;
  },
  findOne(query: any) {
    if (query?.competitionId) {
      this.tempOutput = competitionsStub().find((el: CompetitionDocument) => el.competitionId === query.competitionId);
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
    // competition document with a save() method.
    if (typeof temp?.length === 'number') {
      return temp;
    } else {
      return { ...temp, async save() {} };
    }
  },
});
