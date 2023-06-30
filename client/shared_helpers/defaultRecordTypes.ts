import IRecordType from './interfaces/RecordType';
import { Color, WcaRecordType } from './enums';

const defaultRecordTypes: IRecordType[] = [
  {
    label: 'WR',
    wcaEquivalent: WcaRecordType.WR,
    active: false,
    color: Color.Red,
  },
  {
    label: 'ER',
    wcaEquivalent: WcaRecordType.ER,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'NAR',
    wcaEquivalent: WcaRecordType.NAR,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'SAR',
    wcaEquivalent: WcaRecordType.SAR,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'AsR',
    wcaEquivalent: WcaRecordType.AsR,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'AfR',
    wcaEquivalent: WcaRecordType.AfR,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'OcR',
    wcaEquivalent: WcaRecordType.OcR,
    active: false,
    color: Color.Yellow,
  },
  {
    label: 'NR',
    wcaEquivalent: WcaRecordType.NR,
    active: false,
    color: Color.Green,
  },
];

export default defaultRecordTypes;
