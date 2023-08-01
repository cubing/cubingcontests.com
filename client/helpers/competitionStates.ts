import { CompetitionState } from '@sh/enums';

export const competitionStates: any = {
  [CompetitionState.Created]: { id: CompetitionState.Created, label: 'Created' },
  [CompetitionState.Approved]: { id: CompetitionState.Approved, label: 'Approved' },
  [CompetitionState.Ongoing]: { id: CompetitionState.Ongoing, label: 'Ongoing' },
  [CompetitionState.Finished]: { id: CompetitionState.Finished, label: 'Finished' },
  [CompetitionState.Published]: { id: CompetitionState.Published, label: 'Published' },
};
