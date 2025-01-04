import { IEventRule } from "../types.ts";
import { EventFormat, EventGroup, RoundFormat } from "../enums.ts";

export type Event = {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
  groups: EventGroup[]; // the first group must ALWAYS be the main group for the event (e.g. WCA)
  participants: number;
  description?: string;
  rule?: IEventRule;
};

export type FeEvent = Omit<Event, "rule"> & {
  ruleText?: string;
};
