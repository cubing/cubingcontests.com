import { IRecordType } from "@sh/types";
import { recordTypesSeed } from "~/src/seeds/record-types.seed";

export const recordTypesStub = (): IRecordType[] => {
  const output = recordTypesSeed.map((el) => ({ ...el, label: "X" + el.label }));

  output[0].active = true;

  return output as IRecordType[];
};
