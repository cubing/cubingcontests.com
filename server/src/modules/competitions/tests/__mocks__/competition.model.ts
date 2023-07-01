import { CompetitionDocument } from '~/src/models/competition.model';
import { competitionsStub } from '../stubs/competitions.stub';

export const mockCompetitionModel = (): any => ({
  tempOutput: undefined,
  findOne(query: any) {
    if (query.competitionId) {
      this.tempOutput = competitionsStub().filter(
        (el: CompetitionDocument) => el.competitionId === query.competitionId,
      )[0];
    }
    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = null;
    // The resulting mock document objectmust have a save function
    return { ...temp, save() {} };
  },
});
