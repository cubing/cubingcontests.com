import { eventsStub } from '../stubs/events.stub';

export const EventsServiceMock = (): any => ({
  async getEvents(eventIds?: string[]) {
    let tempOutput = eventsStub();

    if (eventIds) {
      tempOutput = tempOutput.filter((el) => eventIds.includes(el.eventId));
    }

    return tempOutput;
  },
});
