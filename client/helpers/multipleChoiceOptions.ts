import { MultiChoiceOption } from './interfaces/MultiChoiceOption';
import { Color, ContestType, EventFormat, RoundProceed } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { eventCategories } from './eventCategories';

export const colorOptions: MultiChoiceOption[] = [
  {
    label: 'No color',
    value: Color.White,
  },
  {
    label: 'Black',
    value: Color.Black,
  },
  {
    label: 'Red',
    value: Color.Red,
  },
  {
    label: 'Yellow',
    value: Color.Yellow,
  },
  {
    label: 'Green',
    value: Color.Green,
  },
  {
    label: 'Cyan',
    value: Color.Cyan,
  },
  {
    label: 'Blue',
    value: Color.Blue,
  },
  {
    label: 'Magenta',
    value: Color.Magenta,
  },
];

export const contestTypeOptions: MultiChoiceOption[] = [
  {
    label: 'Meetup',
    value: ContestType.Meetup,
    color: Color.Green,
  },
  {
    label: 'Online',
    value: ContestType.Online,
    color: Color.Blue,
  },
  {
    label: 'WCA Competition',
    shortLabel: 'WCA',
    value: ContestType.WcaComp,
    color: Color.Red,
  },
  {
    label: 'Competition',
    shortLabel: 'Comp',
    value: ContestType.Competition,
    color: Color.Yellow,
  },
];

export const roundFormatOptions: MultiChoiceOption[] = roundFormats.map((rf) => ({ label: rf.label, value: rf.value }));

export const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: 'Number',
    value: RoundProceed.Number,
  },
  {
    label: 'Percentage',
    value: RoundProceed.Percentage,
  },
];

export const eventFormatOptions: MultiChoiceOption[] = [
  {
    label: 'Time',
    value: EventFormat.Time,
  },
  {
    label: 'Number',
    value: EventFormat.Number,
  },
  {
    label: 'Multi-Blind',
    value: EventFormat.Multi,
  },
];

export const eventCategoryOptions: MultiChoiceOption[] = eventCategories.map((el) => ({
  label: el.title,
  value: el.group,
}));

export const cutoffAttemptsOptions: MultiChoiceOption[] = [
  {
    label: '1',
    value: 1,
  },
  {
    label: '2',
    value: 2,
  },
];
