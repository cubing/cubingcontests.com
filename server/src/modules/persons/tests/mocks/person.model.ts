import { PersonDocument } from '~/src/models/person.model';
import { personsStub } from '../stubs/persons.stub';

export const mockPersonModel = (): any => ({
  tempOutput: undefined,
  find(query: any) {
    this.tempOutput = personsStub();

    if (query?.personId) {
      if (typeof query.personId === 'object') {
        this.tempOutput = this.tempOutput.filter((el: PersonDocument) => query.personId.$in.includes(el.personId));
      } else {
        this.tempOutput = this.tempOutput.filter((el: PersonDocument) => el.personId === query.personId);
      }
    }

    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = undefined;
    return temp;
  },
});
