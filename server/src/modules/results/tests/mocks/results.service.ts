import { IRecordPair } from "~/helpers/types";
import { WcaRecordType } from "~/helpers/enums";

export const ResultsServiceMock = () => ({
  async getEventRecordPairs(): Promise<IRecordPair[]> {
    return [
      {
        wcaEquivalent: WcaRecordType.WR,
        best: 99999999,
        average: 99999999,
      },
    ];
  },
});
