import RoundResultsTable from './RoundResultsTable';
import { ICompetitionEvent, IPerson, IRound } from '@sh/interfaces';
import { roundFormats } from '~/helpers/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';

const EventResults = ({
  compEvent,
  persons,
  onDeleteResult,
}: {
  compEvent: ICompetitionEvent | null;
  persons: IPerson[];
  onDeleteResult?: (personIds: number[]) => void;
}) => {
  let rounds = compEvent.rounds.length > 0 ? [...compEvent.rounds] : [];

  if (compEvent?.rounds.some((el) => el.results.length > 0)) {
    rounds = [...compEvent.rounds].reverse();
  }

  return (
    <div className="mt-5">
      {rounds.map((round: IRound) => (
        <div key={round.roundId} className="mb-4">
          {round.results.length === 0 ? (
            <h5 className="px-2">
              {roundTypes[round.roundTypeId].label}&nbsp;format:&#8194;<b>{roundFormats[round.format].label}</b>
            </h5>
          ) : (
            <>
              <h3 className="mx-2 mb-4 fs-3">
                {compEvent.event.name}
                {rounds.length > 1 ? ' ' + roundTypes[round.roundTypeId].label : ''}
              </h3>
              <RoundResultsTable
                round={round}
                event={compEvent.event}
                persons={persons}
                onDeleteResult={onDeleteResult}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventResults;
