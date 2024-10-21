import { Color } from '~/shared_helpers/enums.ts';

export interface MultiChoiceOption {
  label: string;
  shortLabel?: string;
  value: string | number;
  color?: Color;
  disabled?: boolean;
}
