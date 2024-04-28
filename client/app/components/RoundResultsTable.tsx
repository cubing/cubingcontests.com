import Time from '@c/Time';
import Solves from '@c/Solves';
import Competitor from '@c/Competitor';
import Button from '@c/UI/Button';
import { IResult, IRound, IPerson, IEvent, IRecordType } from '@sh/types';
import { RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { getRoundRanksWithAverage } from '@sh/sharedFunctions';
import { roundFormats } from '@sh/roundFormats';

const RoundResultsTable = ({
  round,
  event,
  persons,
  recordTypes,
  // If one of these is defined, the other must be defined too
  onEditResult,
  onDeleteResult,
  loadingId,
  disableEditAndDelete,
}: {
  round: IRound;
  event: IEvent;
  persons: IPerson[];
  recordTypes: IRecordType[];
  onEditResult?: (result: IResult) => void;
  onDeleteResult?: (resultId: string) => void;
  loadingId?: string;
  disableEditAndDelete?: boolean;
}) => {
  const roundCanHaveAverage = roundFormats.find((rf) => rf.value === round.format).attempts >= 3;
  const roundRanksWithAverage = getRoundRanksWithAverage(round.format);
  let lastRanking = 0;

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
    <div className="flex-grow-1 table-responsive">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Best</th>
            {roundCanHaveAverage && <th scope="col">{round.format === RoundFormat.Average ? 'Average' : 'Mean'}</th>}
            <th scope="col">Solves</th>
            {onDeleteResult && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {round.results.map((result: IResult) => {
            const isTie = result.ranking === lastRanking;
            lastRanking = result.ranking;

            return (
              <tr key={result.personIds[0]}>
                <td className="ps-2" style={getRankingHighlight(result)}>
                  <span className={isTie ? 'text-secondary' : ''}>{result.ranking}</span>
                </td>
                <td className="d-flex flex-wrap gap-2">
                  {result.personIds.map((personId, i) => {
                    const person = persons.find((p: IPerson) => p.personId === personId);
                    if (!person) return <span key={personId}>(name not found)</span>;
                    return (
                      <span key={person.personId} className="d-flex gap-2">
                        <Competitor person={person} />
                        {i !== result.personIds.length - 1 && <span>&</span>}
                      </span>
                    );
                  })}
                </td>
                <td>
                  <Time result={result} event={event} recordTypes={recordTypes} />
                </td>
                {roundCanHaveAverage && (
                  <td>
                    {result.average !== 0 && <Time result={result} event={event} recordTypes={recordTypes} average />}
                  </td>
                )}
                <td>
                  <Solves event={event} attempts={result.attempts} />
                </td>
                {onEditResult && (
                  <td className="py-1">
                    <Button
                      id={`edit_result_${(result as any)._id}_button`}
                      text="Edit"
                      onClick={() => onEditResult(result)}
                      loadingId={loadingId}
                      disabled={disableEditAndDelete}
                      className="me-2 btn btn-primary btn-sm"
                    />
                    <Button
                      id={`delete_result_${(result as any)._id}_button`}
                      text="Delete"
                      onClick={() => onDeleteResult((result as any)._id)}
                      loadingId={loadingId}
                      disabled={disableEditAndDelete}
                      className="btn btn-danger btn-sm"
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoundResultsTable;
