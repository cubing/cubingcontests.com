import { Color } from "~/shared_helpers/enums.ts";

export type MultiChoiceOption<T = string | number> = {
  label: string;
  shortLabel?: string;
  value: T;
  color?: Color;
  disabled?: boolean;
};
