import { IResult, IRound, IPerson, IEvent } from '@sh/interfaces';
import { RoundProceed, RoundType } from '@sh/enums';
import { formatTime, getSolves } from '~/helpers/utilityFunctions';

const RoundResultsTable = ({
  round,
  events,
  persons,
  // If one of these is defined, the other must be defined too
  onEditResult,
  onDeleteResult,
}: {
  round: IRound;
  events: IEvent[];
  persons: IPerson[];
  onEditResult?: (result: IResult) => void;
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

  // Gets green highlight styling if the result made podium or is good enough to proceed to the next round
  const getRankingHighlight = (result: IResult) => {
    if (
      result.ranking <= 3 ||
      (round.roundTypeId !== RoundType.Final &&
        result.ranking <=
          (round.proceed.type === RoundProceed.Number
            ? round.proceed.value
            : Math.round((round.results.length * round.proceed.value) / 100)))
    ) {
      return { color: 'black', background: '#10c010' };
    }

    return {};
  };

  return (
    <div className="flex-grow-1 table-responsive">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Best</th>
            <th scope="col">Average</th>
            <th scope="col">Solves</th>
            {onDeleteResult && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {round.results.map((result: IResult) => (
            <tr key={result.personId}>
              <td className="ps-2" style={getRankingHighlight(result)}>
                {result.ranking}
              </td>
              <td>{getName(result.personId)}</td>
              <td>
                <div className="d-flex align-items-center gap-3">
                  {formatTime(currEventInfo, result.best)}
                  {getRecordBadge(result, 'single')}
                </div>
              </td>
              <td>
                <div className="h-100 d-flex align-items-center gap-3">
                  {formatTime(currEventInfo, result.average, true)}
                  {getRecordBadge(result, 'average')}
                </div>
              </td>
              <td>{getSolves(currEventInfo, result.attempts)}</td>
              {onEditResult && (
                <td className="py-1">
                  <button type="button" onClick={() => onEditResult(result)} className="me-2 btn btn-primary btn-sm">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteResult(result.personId)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
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
