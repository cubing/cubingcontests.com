import { RecordTypeDocument } from "~/src/models/record-type.model";
import { Color, WcaRecordType } from "@sh/enums";

export const activeRecordTypesStub = (): RecordTypeDocument[] => {
  return [
    {
      label: "XWR",
      wcaEquivalent: WcaRecordType.WR,
      order: 10,
      active: true,
      color: Color.Red,
    },
  ] as RecordTypeDocument[];
};
