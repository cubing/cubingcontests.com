import { RoundFormat } from '@sh/enums';

export const roundFormats: any = {
  [RoundFormat.Average]: { id: RoundFormat.Average, label: 'Average of 5', attempts: 5, isAverage: true },
  [RoundFormat.Mean]: { id: RoundFormat.Mean, label: 'Mean of 3', attempts: 3, isAverage: true },
  [RoundFormat.BestOf3]: { id: RoundFormat.BestOf3, label: 'Best of 3', attempts: 3, isAverage: false },
  [RoundFormat.BestOf2]: { id: RoundFormat.BestOf2, label: 'Best of 2', attempts: 2, isAverage: false },
  [RoundFormat.BestOf1]: { id: RoundFormat.BestOf1, label: 'Best of 1', attempts: 1, isAverage: false },
};
