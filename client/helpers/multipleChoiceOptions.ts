import { C } from "./constants.ts";
import { eventCategories } from "./eventCategories.ts";
import type { MultiChoiceOption } from "./types/MultiChoiceOption.ts";

export const colorOptions: MultiChoiceOption[] = [
  {
    label: "No color",
    value: "#fff",
  },
  {
    label: "Black",
    value: "#000",
  },
  {
    label: "Red",
    value: "#f00",
  },
  {
    label: "Yellow",
    value: "#ff0",
  },
  {
    label: "Green",
    value: "#0f0",
  },
  {
    label: "Cyan",
    value: "#0ff",
  },
  {
    label: "Blue",
    value: "#00f",
  },
  {
    label: "Magenta",
    value: "#f0f",
  },
];

export const contestTypeOptions: MultiChoiceOption[] = [
  {
    label: "Meetup",
    value: "meetup",
    color: C.color.success,
  },
  {
    label: "WCA Competition",
    shortLabel: "WCA",
    value: "wca-comp",
    color: C.color.danger,
  },
  {
    label: "Competition",
    shortLabel: "Comp",
    value: "comp",
    color: C.color.warning,
  },
];

export const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: "Number",
    value: "number",
  },
  {
    label: "Percentage",
    value: "percentage",
  },
];

export const eventFormatOptions: MultiChoiceOption[] = [
  {
    label: "Time",
    value: "time",
  },
  {
    label: "Number",
    value: "number",
  },
  {
    label: "Multi-Blind",
    value: "multi",
  },
];

export const eventCategoryOptions: MultiChoiceOption[] = eventCategories.map((ec) => ({
  label: ec.title,
  value: ec.value,
}));

export const cutoffAttemptsOptions: MultiChoiceOption[] = [
  {
    label: "1",
    value: 1,
  },
  {
    label: "2",
    value: 2,
  },
];
