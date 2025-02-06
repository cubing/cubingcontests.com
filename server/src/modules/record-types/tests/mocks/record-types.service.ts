import { WcaRecordType } from "~/helpers/enums";
import { getBaseAvgsFilter, getBaseSinglesFilter } from "~/src/helpers/utilityFunctions";
import { recordTypesStub } from "../stubs/record-types.stub";
import { EventDocument } from "~/src/models/event.model";

export const setEventSingleRecordsMock = jest.fn();
export const setEventAvgRecordsMock = jest.fn();

export const RecordTypesServiceMock = () => ({
  async getRecordTypes(query: any) {
    let tempRecordTypes = recordTypesStub();

    if (query?.active) {
      tempRecordTypes = tempRecordTypes.filter((el) => el.active);
    }

    return tempRecordTypes;
  },
  async setEventSingleRecords(
    event: EventDocument,
    wcaEquiv: WcaRecordType,
    queryFilter: any = getBaseSinglesFilter(event),
  ) {
    setEventSingleRecordsMock(event, wcaEquiv, queryFilter);
  },
  async setEventAvgRecords(
    event: EventDocument,
    wcaEquiv: WcaRecordType,
    queryFilter: any = getBaseAvgsFilter(event),
  ) {
    setEventAvgRecordsMock(event, wcaEquiv, queryFilter);
  },
});
