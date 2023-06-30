import { activeRecordTypesStub } from '@m/record-types/test/stubs/record-types.stub';

export const RecordTypesServiceMock = {
  getRecordTypes: jest.fn().mockResolvedValue(activeRecordTypesStub()),
};
