import { activeRecordTypesStub } from '@m/record-types/tests/stubs/record-types.stub';

export const RecordTypesServiceMock = {
  getRecordTypes: jest.fn().mockResolvedValue(activeRecordTypesStub()),
};
