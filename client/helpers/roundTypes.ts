import { RoundType } from '@sh/enums';

export const roundTypes: any = {
  [RoundType.First]: { id: RoundType.First, label: 'First round' },
  [RoundType.Second]: { id: RoundType.Second, label: 'Second round' },
  [RoundType.Semi]: { id: RoundType.Semi, label: 'Semi Final' },
  [RoundType.Final]: { id: RoundType.Final, label: 'Final' },
};
