import { RoundFormat } from '~/shared_helpers/enums.ts';

export const roundFormats = [
  {
    value: RoundFormat.BestOf1,
    label: 'Best of 1',
    shortLabel: 'Bo1',
    attempts: 1,
    isAverage: false,
  },
  {
    value: RoundFormat.BestOf2,
    label: 'Best of 2',
    shortLabel: 'Bo2',
    attempts: 2,
    isAverage: false,
  },
  {
    value: RoundFormat.BestOf3,
    label: 'Best of 3',
    shortLabel: 'Bo3',
    attempts: 3,
    isAverage: false,
  },
  {
    value: RoundFormat.Mean,
    label: 'Mean of 3',
    shortLabel: 'Mo3',
    attempts: 3,
    isAverage: true,
  },
  {
    value: RoundFormat.Average,
    label: 'Average of 5',
    shortLabel: 'Ao5',
    attempts: 5,
    isAverage: true,
  },
];
