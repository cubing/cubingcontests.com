import { IEvent } from '@sh/interfaces';
import { EventFormat, EventGroup } from '@sh/enums';

export const mockTimeEvent = {
  eventId: '333',
  format: EventFormat.Time,
  groups: [EventGroup.WCA],
} as IEvent;
