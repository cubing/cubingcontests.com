import { MultiChoiceOption } from './interfaces/MultiChoiceOption';
import { Color, ContestType, RoundProceed } from '~/shared_helpers/enums';
import { roundFormats } from '../shared_helpers/roundFormats';

export const colorOptions: MultiChoiceOption[] = [
  {
    label: 'No color',
    value: Color.White,
  },
  {
    label: 'Blue',
    value: Color.Blue,
  },
  {
    label: 'Red',
    value: Color.Red,
  },
  {
    label: 'Green',
    value: Color.Green,
  },
  {
    label: 'Yellow',
    value: Color.Yellow,
  },
  {
    label: 'Cyan',
    value: Color.Cyan,
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
    label: 'Competition',
    value: ContestType.Competition,
    color: Color.Red,
  },
];

export const roundFormatOptions: MultiChoiceOption[] = Object.values(roundFormats).map((rf: any) => ({
  label: rf.label,
  value: rf.id,
}));

export const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: 'Number',
    value: RoundProceed.Number,
  },
  {
    label: '%',
    value: RoundProceed.Percentage,
  },
];
