import { Color, WcaRecordType } from '../enums';

export interface IRecordType {
  label: string;
  wcaEquivalent: WcaRecordType;
  order: number;
  active: boolean; // whether to track this record type
  color: Color;
}
