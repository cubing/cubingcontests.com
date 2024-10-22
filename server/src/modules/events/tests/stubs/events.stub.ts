import { EventDocument } from "~/src/models/event.model";
import { eventsSeed } from "~/src/seeds/events.seed";

export const eventsStub = (): EventDocument[] => {
  return [...(eventsSeed as EventDocument[])];
};
