import { PersonDocument } from '~/src/models/person.model';
import { personsStub } from '../stubs/persons.stub';

export const PersonsServiceMock = (): any => ({
  async getPersonsById(personIds?: number[]) {
    let tempOutput = personsStub();

    if (personIds) {
      tempOutput = tempOutput.filter((el: PersonDocument) => personIds.includes(el.personId));
    }

    return tempOutput;
  },
});
