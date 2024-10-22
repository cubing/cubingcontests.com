import { IEvent } from "../shared_helpers/types.ts";
import { EventFormat, EventGroup } from "../shared_helpers/enums.ts";

export const mockTimeEvent = {
  eventId: "333",
  format: EventFormat.Time,
  groups: [EventGroup.WCA],
} as IEvent;
