import { ContestState } from '@sh/enums';

export const competitionStates: any = {
  [ContestState.Created]: { id: ContestState.Created, label: 'Created' },
  [ContestState.Approved]: { id: ContestState.Approved, label: 'Approved' },
  [ContestState.Ongoing]: { id: ContestState.Ongoing, label: 'Ongoing' },
  [ContestState.Finished]: { id: ContestState.Finished, label: 'Finished' },
  [ContestState.Published]: { id: ContestState.Published, label: 'Published' },
};
