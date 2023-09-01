import { PersonDocument } from '~/src/models/person.model';
import { personsStub } from '../stubs/persons.stub';

export const PersonsServiceMock = (): any => ({
  getPersonsById(personIds?: number[]) {
    let tempOutput = personsStub();

    if (personIds) {
      tempOutput = tempOutput.filter((el: PersonDocument) => personIds.includes(el.personId));
    }

    return tempOutput;
  },
  getCompetitionParticipants() {
    return 999;
  },
});
