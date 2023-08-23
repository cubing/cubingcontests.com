import { EventFormat, RoundFormat, EventGroup } from '../enums';

export interface IEvent {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
  groups: EventGroup[];
  participants?: number; // only required if the format is team time
}
