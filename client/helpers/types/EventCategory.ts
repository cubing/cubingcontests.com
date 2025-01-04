import type { EventGroup } from "@cc/shared";

export type EventCategory = {
  title: string;
  shortTitle?: string;
  value: string;
  group: EventGroup;
  description?: string;
};
