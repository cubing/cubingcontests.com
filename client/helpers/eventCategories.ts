import { EventGroup } from "~/helpers/enums.ts";
import type { EventCategory } from "~/helpers/types/EventCategory.ts";

export const eventCategories: EventCategory[] = [
  {
    title: "Unofficial",
    value: "unofficial",
    group: EventGroup.Unofficial,
    description:
      "These events can be held at WCA competitions (unofficially), unofficial competitions, and speedcuber meetups.",
  },
  {
    title: "WCA",
    value: "wca",
    group: EventGroup.WCA,
    description:
      "This is based on results from speedcuber meetups. 4x4x4-5x5x5 Blindfolded and Multi-Blind also allow submitted results with video evidence.",
  },
  {
    title: "Extreme BLD",
    shortTitle: "BLD",
    value: "extremebld",
    group: EventGroup.ExtremeBLD,
    description: "These events are submission-only and require video evidence.",
  },
  {
    title: "Miscellaneous",
    shortTitle: "Misc.",
    value: "miscellaneous",
    group: EventGroup.Miscellaneous,
    description:
      "These events can be held at WCA competitions (unofficially), unofficial competitions, and speedcuber meetups. They tend to be less competitive than the events in the Unofficial category.",
  },
  {
    title: "Removed",
    value: "removed",
    group: EventGroup.Removed,
  },
];
