import { CompetitionEvent } from '~/src/models/competition.model';
import { sameDayRounds } from './same-day-rounds.stub';

export const newCompetitionEvents = (): CompetitionEvent[] => {
  return [
    {
      eventId: '333',
      rounds: sameDayRounds(),
    },
  ];
};
