import { recordTypesStub } from '@sh/sharedFunctions';

export const RecordTypesServiceMock = (): any => ({
  async getRecordTypes(query: any) {
    let tempRecordTypes = recordTypesStub(true);

    if (query?.active) {
      tempRecordTypes = tempRecordTypes.filter((el) => el.active);
    }

    return tempRecordTypes;
  },
});
