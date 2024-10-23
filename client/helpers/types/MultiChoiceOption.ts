import { Color } from "~/shared_helpers/enums.ts";

export type MultiChoiceOption = {
  label: string;
  shortLabel?: string;
  value: string | number;
  color?: Color;
  disabled?: boolean;
};
