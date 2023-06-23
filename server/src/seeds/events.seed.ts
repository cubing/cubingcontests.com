import { EventFormat } from '@sh/enums';
import IEvent from '@sh/interfaces/IEvent';

// Official WCA events
export default [
  {
    eventId: '333',
    name: '3x3x3 Cube',
    rank: 10,
    formatId: EventFormat.Time,
  },
  {
    eventId: '222',
    name: '2x2x2 Cube',
    rank: 20,
    formatId: EventFormat.Time,
  },
  {
    eventId: '444',
    name: '4x4x4 Cube',
    rank: 30,
    formatId: EventFormat.Time,
  },
  {
    eventId: '555',
    name: '5x5x5 Cube',
    rank: 40,
    formatId: EventFormat.Time,
  },
  {
    eventId: '666',
    name: '6x6x6 Cube',
    rank: 50,
    formatId: EventFormat.Time,
  },
  {
    eventId: '777',
    name: '7x7x7 Cube',
    rank: 60,
    formatId: EventFormat.Time,
  },
  {
    eventId: '333bf',
    name: '3x3x3 Blindfolded',
    rank: 70,
    formatId: EventFormat.Time,
  },
  {
    eventId: '333fm',
    name: '3x3x3 Fewest Moves',
    rank: 80,
    formatId: EventFormat.Number,
  },
  {
    eventId: '333oh',
    name: '3x3x3 One-Handed',
    rank: 90,
    formatId: EventFormat.Time,
  },
  {
    eventId: 'clock',
    name: 'Clock',
    rank: 110,
    formatId: EventFormat.Time,
  },
  {
    eventId: 'minx',
    name: 'Megaminx',
    rank: 120,
    formatId: EventFormat.Time,
  },
  {
    eventId: 'pyram',
    name: 'Pyraminx',
    rank: 130,
    formatId: EventFormat.Time,
  },
  {
    eventId: 'skewb',
    name: 'Skewb',
    rank: 140,
    formatId: EventFormat.Time,
  },
  {
    eventId: 'sq1',
    name: 'Square-1',
    rank: 150,
    formatId: EventFormat.Time,
  },
  {
    eventId: '444bf',
    name: '4x4x4 Blindfolded',
    rank: 160,
    formatId: EventFormat.Time,
  },
  {
    eventId: '555bf',
    name: '5x5x5 Blindfolded',
    rank: 170,
    formatId: EventFormat.Time,
  },
  {
    eventId: '333mbf',
    name: '3x3x3 Multi-Blind',
    rank: 180,
    formatId: EventFormat.Multi,
  },
] as IEvent[];
