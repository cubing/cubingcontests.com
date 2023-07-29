import RoundResultsTable from './RoundResultsTable';
import { ICompetitionEvent, IEvent, IPerson, IRound } from '@sh/interfaces';
import { roundFormats } from '~/helpers/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';

const EventResults = ({
  event,
  events,
  persons,
  onDeleteResult,
}: {
  event: ICompetitionEvent | null;
  events: IEvent[];
  persons: IPerson[];
  onDeleteResult?: (personId: string) => void;
}) => {
  const rounds = event?.rounds.length > 0 ? [...event.rounds].reverse() : [];

  return (
    <div className="my-5">
      {rounds.map((round: IRound) =>
        round.results.length === 0 ? (
          <h5 key={round.roundTypeId} className="mb-4">
            {roundTypes[round.roundTypeId].label}&nbsp;format:&#8194;<b>{roundFormats[round.format].label}</b>
          </h5>
        ) : (
          <div key={round.roundTypeId} className="mb-4">
            <h3 className="mx-2 mb-4 fs-3">
              {`${events.find((el) => el.eventId === round.eventId)?.name} ${roundTypes[round.roundTypeId].label}`}
            </h3>
            <RoundResultsTable round={round} events={events} persons={persons} onDeleteResult={onDeleteResult} />
          </div>
        ),
      )}
    </div>
  );
};

export default EventResults;
