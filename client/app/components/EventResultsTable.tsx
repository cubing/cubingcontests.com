import RoundResultsTable from './RoundResultsTable';
import { IContestEvent, IPerson, IRecordType, IRound } from '@sh/interfaces';
import { roundTypes } from '~/helpers/roundTypes';

const EventResultsTable = ({
  contestEvent,
  persons,
  recordTypes,
  onDeleteResult,
}: {
  contestEvent: IContestEvent | null;
  persons: IPerson[];
  recordTypes: IRecordType[];
  onDeleteResult?: (resultId: string) => void;
}) => {
  let rounds = contestEvent.rounds.length > 0 ? [...contestEvent.rounds] : [];

  if (contestEvent?.rounds.some((el) => el.results.length > 0)) {
    rounds = [...contestEvent.rounds].reverse();
  }

  return (
    <div className="mt-3">
      {rounds.map((round: IRound) => (
        <div key={round.roundId} className="mb-4">
          <h3 className="mx-2 mb-4 fs-3">
            {contestEvent.event.name}
            {rounds.length > 1 && ` ${roundTypes[round.roundTypeId].label}`}
          </h3>

          <RoundResultsTable
            round={round}
            event={contestEvent.event}
            persons={persons}
            recordTypes={recordTypes}
            onDeleteResult={onDeleteResult}
          />
        </div>
      ))}
    </div>
  );
};

export default EventResultsTable;
