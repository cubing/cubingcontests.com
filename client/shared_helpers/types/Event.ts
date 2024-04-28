import { IEventRule } from '@sh/types';
import { EventFormat, EventGroup, RoundFormat } from '@sh/enums';

export type IEvent = {
  eventId: string;
  name: string;
  rank: number;
  format: EventFormat;
  defaultRoundFormat: RoundFormat;
  groups: EventGroup[]; // the first group must ALWAYS be the main group for the event (e.g. WCA)
  participants?: number; // only required if the format is team time
  description?: string;
  rule?: IEventRule;
};

export type IFeEvent = Omit<IEvent, 'rule'> & {
  ruleText?: string;
};
