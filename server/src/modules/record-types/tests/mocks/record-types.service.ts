import { recordTypesStub } from '../stubs/record-types.stub';

export const RecordTypesServiceMock = (): any => ({
  async getRecordTypes(query: any) {
    let tempRecordTypes = recordTypesStub();

    if (query?.active) {
      tempRecordTypes = tempRecordTypes.filter((el) => el.active);
    }

    return tempRecordTypes;
  },
});
