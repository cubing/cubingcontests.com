import { EventCategory } from "./types.ts";

export type EventCategoryObject = {
  title: string;
  shortTitle?: string;
  value: EventCategory;
  description?: string;
};

export const eventCategories: EventCategoryObject[] = [
  {
    title: "Unofficial",
    value: "unofficial",
    description:
      "These events can be held at WCA competitions (unofficially), unofficial competitions, and speedcuber meetups.",
  },
  {
    title: "WCA",
    value: "wca",
    description:
      "This is based on results from speedcuber meetups. 4x4x4-5x5x5 Blindfolded and Multi-Blind also allow submitted results with video evidence.",
  },
  {
    title: "Extreme BLD",
    shortTitle: "BLD",
    value: "extreme-bld",
    description: "These events are submission-only and require video evidence.",
  },
  {
    title: "Miscellaneous",
    shortTitle: "Misc.",
    value: "miscellaneous",
    description:
      "These events can be held at WCA competitions (unofficially), unofficial competitions, and speedcuber meetups. They tend to be less competitive than the events in the Unofficial category.",
  },
  {
    title: "Removed",
    value: "removed",
  },
];
