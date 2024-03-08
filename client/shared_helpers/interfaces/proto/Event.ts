import { EventFormat, RoundFormat, EventGroup } from '@sh/enums';

export interface IProtoEvent {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
  groups: EventGroup[]; // the first group must ALWAYS be the main group for the event (e.g. WCA)
  participants?: number; // only required if the format is team time
  description?: string;
}
