import { IRecordPair } from "@sh/types";
import { WcaRecordType } from "@sh/enums";

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
