export type OptionValueType = string | number;

export type MultiChoiceOption<T = OptionValueType> = {
  label: string;
  shortLabel?: string;
  value: T;
  color?: string;
  disabled?: boolean;
};
