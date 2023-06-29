import { EventFormat, RoundFormat } from '../enums';

interface IEvent {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
}

export default IEvent;
