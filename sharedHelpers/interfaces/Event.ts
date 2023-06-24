import { EventFormat } from '../enums';

interface IEvent {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
}

export default IEvent;
