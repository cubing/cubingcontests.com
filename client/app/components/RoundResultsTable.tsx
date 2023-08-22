import { IResult, IRound, IPerson, IEvent, IRecordType } from '@sh/interfaces';
import { Color, RoundProceed, RoundType } from '@sh/enums';
import { formatTime, getSolves, getRoundCanHaveAverage, getRoundRanksWithAverage } from '~/helpers/utilityFunctions';

const RoundResultsTable = ({
  round,
  event,
  persons,
  recordTypes,
  // If one of these is defined, the other must be defined too
  onEditResult,
  onDeleteResult,
}: {
  round: IRound;
  event: IEvent;
  persons: IPerson[];
  recordTypes: IRecordType[];
  onEditResult?: (result: IResult) => void;
  onDeleteResult?: (personIds: number[]) => void;
}) => {
  const roundCanHaveAverage = getRoundCanHaveAverage(round, event);
  const roundRanksWithAverage = getRoundRanksWithAverage(round, event);

  const getName = (personIds: number[]): string => {
    if (!persons) throw new Error('Name not found');

    return personIds
      .map((id) => persons.find((p: IPerson) => p.personId === id)?.name || '(name not found)')
      .join(' & ');
  };

  const getRecordBadge = (result: IResult, type: 'single' | 'average') => {
    const recordType = recordTypes.find(
      (rt) => (type === 'single' ? result.regionalSingleRecord : result.regionalAverageRecord) === rt.wcaEquivalent,
    );

    if (!recordType) return null;

    let colorClass: string;

    switch (recordType.color) {
      case Color.Red:
        colorClass = 'bg-danger';
        break;
      case Color.Blue:
        colorClass = 'bg-primary';
        break;
      case Color.Green:
        colorClass = 'bg-success';
        break;
      case Color.Yellow:
        colorClass = 'bg-warning';
        break;
      case Color.White:
        colorClass = 'bg-light';
        break;
      case Color.Cyan:
        colorClass = 'bg-info';
        break;
      // The magenta option is skipped, because it is not available in RecordTypesForm
      default:
        colorClass = 'bg-dark';
        console.error(`Unknown record color: ${recordType.color}`);
    }

    return (
      <span className={'badge ' + colorClass} style={{ fontSize: '0.7rem' }}>
        {recordType.label}
      </span>
    );
  };

  // Gets green highlight styling if the result is not DNF/DNS and made podium or is good enough to proceed to the next round
  const getRankingHighlight = (result: IResult) => {
    if (
      ((roundRanksWithAverage && result.average > 0) || (!roundRanksWithAverage && result.best > 0)) &&
      // This is necessary to account for rounding down to 0 (see Math.floor() below)
      (result.ranking === 1 ||
        // Final round and the ranking is in the top 3
        (round.roundTypeId === RoundType.Final && result.ranking <= 3) ||
        // Non-final round and the ranking satisfies the proceed parameters
        (round.roundTypeId !== RoundType.Final &&
          result.ranking <=
            (round.proceed.type === RoundProceed.Number
              ? round.proceed.value
              : Math.floor((round.results.length * round.proceed.value) / 100))))
    ) {
      return { color: 'black', background: '#10c010' };
    }

    return {};
  };

  return (
    <div className="flex-grow-1 mb-5 table-responsive">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Best</th>
            {roundCanHaveAverage && <th scope="col">Average</th>}
            <th scope="col">Solves</th>
            {onDeleteResult && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {round.results.map((result: IResult) => (
            <tr key={result.personIds.join()}>
              <td className="ps-2" style={getRankingHighlight(result)}>
                {result.ranking}
              </td>
              <td>{getName(result.personIds)}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {formatTime(result.best, event)}
                  {getRecordBadge(result, 'single')}
                </div>
              </td>
              {roundCanHaveAverage && (
                <td>
                  <div className="h-100 d-flex align-items-center gap-2">
                    {formatTime(result.average, event, { isAverage: true })}
                    {getRecordBadge(result, 'average')}
                  </div>
                </td>
              )}
              <td>{getSolves(event, result.attempts)}</td>
              {onEditResult && (
                <td className="py-1">
                  <button type="button" onClick={() => onEditResult(result)} className="me-2 btn btn-primary btn-sm">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteResult(result.personIds)}
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
