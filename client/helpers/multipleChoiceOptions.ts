import type { ContestType, EventFormat, RecordCategory } from "~/helpers/types.ts";
import { C } from "./constants.ts";
import { eventCategories } from "./event-categories.ts";
import type { MultiChoiceOption } from "./types/MultiChoiceOption.ts";

export const colorOptions: MultiChoiceOption[] = [
  { label: "No color", value: "#fff" },
  { label: "Black", value: "#000" },
  { label: "Red", value: "#f00" },
  { label: "Yellow", value: "#ff0" },
  { label: "Green", value: "#0f0" },
  { label: "Cyan", value: "#0ff" },
  { label: "Blue", value: "#00f" },
  { label: "Magenta", value: "#f0f" },
];

export const contestTypeOptions: MultiChoiceOption<ContestType>[] = [
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
  {
    label: "Meetup",
    value: "meetup",
    color: C.color.success,
  },
  {
    label: "Online",
    value: "online",
    color: C.color.primary,
  },
];

export const roundProceedOptions: MultiChoiceOption[] = [
  { label: "Number", value: "number" },
  { label: "Percentage", value: "percentage" },
];

export const eventFormatOptions: MultiChoiceOption<EventFormat>[] = [
  { label: "Time (2 decimals)", value: "time" },
  { label: "Time (3 decimals)", value: "time-3d" },
  { label: "Number", value: "number" },
  { label: "Multi", value: "multi" },
];

export const eventCategoryOptions: MultiChoiceOption[] = eventCategories.map((ec) => ({
  label: ec.title,
  value: ec.value,
}));

export const cutoffAttemptsOptions: MultiChoiceOption[] = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
];

export const recordCategoryOptions: MultiChoiceOption<RecordCategory>[] = [
  { value: "competitions", label: "Competitions" },
  { value: "meetups", label: "Meetups" },
  { value: "online", label: "Online" },
];
