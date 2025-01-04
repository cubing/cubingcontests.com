import { Color } from "@cc/shared";

export type MultiChoiceOption<T = string | number> = {
  label: string;
  shortLabel?: string;
  value: T;
  color?: Color;
  disabled?: boolean;
};
