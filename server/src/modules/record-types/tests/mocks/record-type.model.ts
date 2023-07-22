import { RecordTypeDocument } from '~/src/models/record-type.model';

export const mockRecordTypeModel = (): any => ({
  tempOutput: undefined,
  create: jest.fn(),
  deleteMany() {
    return this;
  },
  find(): RecordTypeDocument[] {
    this.tempOutput = [];
    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = undefined;
    return temp;
  },
});
