import { CompetitionDocument } from '~/src/models/competition.model';

export const competition = (): CompetitionDocument => {
  return {
    competitionId: 'TestComp2023',
    name: 'Test Competition 2023',
    city: 'Testville',
    countryId: 'DE',
    startDate: new Date(),
    endDate: new Date(),
    mainEventId: '333',
    events: [],
    participants: 0,
  } as CompetitionDocument;
};
