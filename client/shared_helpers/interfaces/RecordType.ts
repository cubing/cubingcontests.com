import { Color } from '@sh/enums';
import { WcaRecordType } from '../enums';

interface IRecordType {
  label: string;
  wcaEquivalent: WcaRecordType;
  active: boolean; // whether to track this record type
  color: Color;
}

export default IRecordType;
