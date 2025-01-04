import { IRecordPair } from "~/shared/types";
import { WcaRecordType } from "~/shared/enums";

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
