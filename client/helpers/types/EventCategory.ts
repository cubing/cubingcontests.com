import type { EventGroup } from '~/shared_helpers/enums.ts';

export type EventCategory = {
  title: string;
  shortTitle?: string;
  value: string;
  group: EventGroup;
  description?: string;
};
