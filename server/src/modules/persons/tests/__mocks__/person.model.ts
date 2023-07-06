import { PersonDocument } from '~/src/models/person.model';

export const mockPersonModel = (): any => ({
  find() {
    return this;
  },
  exec() {
    return [] as PersonDocument[];
  },
});
