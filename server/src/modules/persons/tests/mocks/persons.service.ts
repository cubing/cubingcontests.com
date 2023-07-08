import { PersonDocument } from '~/src/models/person.model';
import { personsStub } from '../stubs/persons.stub';

export const PersonsServiceMock = {
  async getPersonsById(personIds?: number[] | string) {
    let tempOutput = personsStub();

    if (personIds) {
      if (typeof personIds[0] === 'number') {
        // @ts-ignore
        tempOutput = tempOutput.filter((el: PersonDocument) => personIds.includes(el.personId));
      } else {
        tempOutput = tempOutput.filter((el: PersonDocument) =>
          personIds
            // @ts-ignore
            .split(';')
            .map((id: string) => parseInt(id))
            .includes(el.personId),
        );
      }
    }

    return tempOutput;
  },
};
