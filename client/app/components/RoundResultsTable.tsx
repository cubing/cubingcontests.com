import { IResult, IRound, IPerson, IEvent } from '@sh/interfaces';
import { formatTime, getSolves } from '~/helpers/utilityFunctions';

const RoundResultsTable = ({
  round,
  events,
  persons,
  onDeleteResult,
}: {
  round: IRound;
  events: IEvent[];
  persons: IPerson[];
  onDeleteResult?: (personId: string) => void;
}) => {
  const currEventInfo = round?.eventId ? events.find((el) => el.eventId === round.eventId) : null;

  const getName = (personId: string): string => {
    if (!persons || personId === '') throw new Error('Name not found');

    // To account for team events that have multiple people separated by ;
    return personId
      .split(';')
      .map((id: string) => persons.find((el: IPerson) => el.personId.toString() === id)?.name || 'Error')
      .join(' & ');
  };

  const getRecordBadge = (result: IResult, type: 'single' | 'average') => {
    const recordLabel = type === 'single' ? result.regionalSingleRecord : result.regionalAverageRecord;
    if (!recordLabel) return null;

    // THIS IS HARD-CODED TEMPORARILY
    const colorClass = 'bg-danger';

    // switch(recordLabel) {
    //   case '':
    //     colorClass = '';
    //     break;
    //   default:
    //     throw new Error(`Unknown record label: ${recordLabel}`)
    // }

    return <span className={'badge ' + colorClass}>{recordLabel}</span>;
  };

  return (
    <div className="flex-grow-1 table-responsive">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Best</th>
            <th>Average</th>
            <th>Solves</th>
            {onDeleteResult && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {round.results.map((result: IResult) => (
            <tr key={result.personId}>
              <td>{result.ranking}</td>
              <td>{getName(result.personId)}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {formatTime(currEventInfo, result.best)}
                  {getRecordBadge(result, 'single')}
                </div>
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {formatTime(currEventInfo, result.average, true)}
                  {getRecordBadge(result, 'average')}
                </div>
              </td>
              <td>{getSolves(currEventInfo, result.attempts)}</td>
              {onDeleteResult && (
                <td>
                  <button
                    type="button"
                    onClick={() => onDeleteResult(result.personId)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoundResultsTable;
