import { IResult, IRound, IPerson, IEvent } from '@sh/interfaces';

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

  const formatTime = (time: number, isAverage = false): string => {
    if (time === -1) {
      return 'DNF';
    } else if (time === -2) {
      return 'DNS';
    } else if (currEventInfo?.format === 'number') {
      if (isAverage) return (time / 100).toFixed(2);
      else return time.toString();
    } else {
      let output = '';
      const hours = Math.floor(time / 360000);
      const minutes = Math.floor(time / 6000) % 60;
      const seconds = (time - hours * 360000 - minutes * 6000) / 100;

      if (hours > 0) output = hours + ':';
      if (hours > 0 || minutes > 0) {
        if (minutes === 0) output += '00:';
        else if (minutes < 10 && hours > 0) output += '0' + minutes + ':';
        else output += minutes + ':';
      }
      if (seconds < 10 && (hours > 0 || minutes > 0)) output += '0';
      output += seconds;
      if (!output.includes('.')) output += '.00';
      else if (output.split('.')[1].length === 1) output += '0';

      return output;
    }
  };

  const getSolves = (attempts: number[]): string => {
    // The character in quotes is an em space
    return attempts.map((el) => formatTime(el)).join(' ');
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
                <div className="d-flex align-items-center gap-3">
                  {formatTime(result.best)}
                  {getRecordBadge(result, 'single')}
                </div>
              </td>
              <td>
                <div className="d-flex align-items-center gap-3">
                  {formatTime(result.average, true)}
                  {getRecordBadge(result, 'average')}
                </div>
              </td>
              <td>{getSolves(result.attempts)}</td>
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
