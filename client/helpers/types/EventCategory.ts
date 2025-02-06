import type { EventGroup } from "~/helpers/enums.ts";

export type EventCategory = {
  title: string;
  shortTitle?: string;
  value: string;
  group: EventGroup;
  description?: string;
};
