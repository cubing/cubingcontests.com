import { IEvent } from '@sh/types';
import { EventFormat, EventGroup } from '@sh/enums';

export const mockTimeEvent = {
  eventId: '333',
  format: EventFormat.Time,
  groups: [EventGroup.WCA],
} as IEvent;
