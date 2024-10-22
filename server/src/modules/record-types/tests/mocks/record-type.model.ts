import { RecordTypeDocument } from "~/src/models/record-type.model";
import { recordTypesStub } from "../stubs/record-types.stub";

export const RecordTypeModelMock = (): any => ({
  tempOutput: undefined,
  create: jest.fn(),
  updateOne() {
    return this;
  },
  deleteMany() {
    return this;
  },
  find(): RecordTypeDocument[] {
    this.tempOutput = recordTypesStub();

    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = undefined;
    return temp;
  },
});
