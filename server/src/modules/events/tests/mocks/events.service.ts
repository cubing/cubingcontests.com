import { eventsStub } from '../stubs/events.stub';
import { EventGroup } from '@sh/enums';

export const EventsServiceMock = (): any => ({
  getEvents({ eventIds, includeHidden }: { eventIds?: string[]; includeHidden?: boolean } = { includeHidden: false }) {
    let tempOutput = eventsStub();

    if (eventIds) tempOutput = tempOutput.filter((el) => eventIds.includes(el.eventId));
    if (!includeHidden) tempOutput = tempOutput.filter((el) => !el.groups.includes(EventGroup.Hidden));

    return tempOutput;
  },
  getEventById(eventId: string) {
    return eventsStub().find((el) => el.eventId === eventId);
  },
});
