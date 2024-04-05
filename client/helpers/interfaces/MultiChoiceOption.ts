import { Color } from '@sh/enums';

export interface MultiChoiceOption {
  label: string;
  shortLabel?: string;
  value: string | number;
  color?: Color;
  disabled?: boolean;
}
