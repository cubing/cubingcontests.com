import { eventsStub } from '../stubs/events.stub';

export const EventsServiceMock = (): any => ({
  getEvents(eventIds?: string[]) {
    let tempOutput = eventsStub();

    if (eventIds) {
      tempOutput = tempOutput.filter((el) => eventIds.includes(el.eventId));
    }

    return tempOutput;
  },
  getEventById(eventId: string) {
    return eventsStub().find((el) => el.eventId === eventId);
  },
});
