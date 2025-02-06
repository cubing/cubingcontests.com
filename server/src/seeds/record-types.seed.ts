import { IRecordType } from "~/helpers/types";
import { Color, WcaRecordType } from "~/helpers/enums";

export const recordTypesSeed: IRecordType[] = [
  {
    label: "WR",
    wcaEquivalent: WcaRecordType.WR,
    order: 10,
    active: false,
    color: Color.Red,
  },
  {
    label: "ER",
    wcaEquivalent: WcaRecordType.ER,
    order: 20,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "NAR",
    wcaEquivalent: WcaRecordType.NAR,
    order: 30,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "SAR",
    wcaEquivalent: WcaRecordType.SAR,
    order: 40,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "AsR",
    wcaEquivalent: WcaRecordType.AsR,
    order: 50,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "AfR",
    wcaEquivalent: WcaRecordType.AfR,
    order: 60,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "OcR",
    wcaEquivalent: WcaRecordType.OcR,
    order: 70,
    active: false,
    color: Color.Yellow,
  },
  {
    label: "NR",
    wcaEquivalent: WcaRecordType.NR,
    order: 80,
    active: false,
    color: Color.Green,
  },
  {
    label: "PR",
    wcaEquivalent: WcaRecordType.PR,
    order: 90,
    active: false,
    color: Color.Blue,
  },
];
