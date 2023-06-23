import { EventFormat } from '../enums';

interface IEvent {
  eventId: string;
  name: string;
  rank: number;
  formatId: EventFormat;
}

export default IEvent;
