import { EventFormat, RoundFormat } from '../enums';

export interface IEvent {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
  meetupOnly?: boolean;
  removed?: boolean;
}
