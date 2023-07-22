import { recordTypesStub } from '@sh/sharedFunctions';

export const RecordTypesServiceMock = {
  getRecordTypes: jest.fn().mockResolvedValue(recordTypesStub(true)),
};
