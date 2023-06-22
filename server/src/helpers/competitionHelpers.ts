import { CompetitionDocument } from '~/src/models/competition.model';

export const formatCompetition = (comp: CompetitionDocument) => {
  return {
    competitionId: comp.competitionId,
    name: comp.name,
    city: comp.city,
    country: comp.country,
    startDate: comp.startDate,
    endDate: comp.endDate,
    mainEventId: comp.mainEventId,
    // participants:
    // events:
  };
};
