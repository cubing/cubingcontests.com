import { RoundType } from '~/shared_helpers/enums.ts';

export const roundTypes: any = {
  [RoundType.First]: { id: RoundType.First, label: 'First round' },
  [RoundType.Second]: { id: RoundType.Second, label: 'Second round' },
  [RoundType.Third]: { id: RoundType.Third, label: 'Third round' },
  [RoundType.Fourth]: { id: RoundType.Fourth, label: 'Fourth round' },
  [RoundType.Fifth]: { id: RoundType.Fifth, label: 'Fifth round' },
  [RoundType.Sixth]: { id: RoundType.Sixth, label: 'Sixth round' },
  [RoundType.Seventh]: { id: RoundType.Seventh, label: 'Seventh round' },
  [RoundType.Eighth]: { id: RoundType.Eighth, label: 'Eighth round' },
  [RoundType.Semi]: { id: RoundType.Semi, label: 'Semi Final' },
  [RoundType.Final]: { id: RoundType.Final, label: 'Final' },
};
