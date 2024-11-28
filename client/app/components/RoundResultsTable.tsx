import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import Time from "~/app/components/Time.tsx";
import Solves from "~/app/components/Solves.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { IEvent, IPerson, IRecordType, IResult, IRound, type IRoundFormat } from "~/shared_helpers/types.ts";
import { RoundFormat, RoundType } from "~/shared_helpers/enums.ts";
import { getIsProceedableResult } from "~/shared_helpers/sharedFunctions.ts";
import { roundFormats } from "~/shared_helpers/roundFormats.ts";

type Props = {
  round: IRound;
  event: IEvent;
  persons: IPerson[];
  recordTypes: IRecordType[];
  onEditResult?: (result: IResult) => void;
  onDeleteResult?: (resultId: string) => void;
  loadingId?: string;
  disableEditAndDelete?: boolean;
};

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
}: Props) => {
  const roundFormat = roundFormats.find((rf) => rf.value === round.format) as IRoundFormat;
  const roundCanHaveAverage = roundFormat.attempts >= 3;
  let lastRanking = 0;

  // Gets green highlight styling if the result is not DNF/DNS and made podium or is good enough to proceed to the next round
  const getRankingHighlight = (result: IResult) => {
    if (
      result.proceeds ||
      (round.roundTypeId === RoundType.Final && result.ranking <= 3 && getIsProceedableResult(result, roundFormat))
    ) {
      return { color: "black", background: "#10c010" };
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
            {roundCanHaveAverage && <th scope="col">{round.format === RoundFormat.Average ? "Average" : "Mean"}</th>}
            <th scope="col">Attempts</th>
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
                  <span className={isTie ? "text-secondary" : ""}>{result.ranking}</span>
                </td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    {result.personIds.map((personId, i) => {
                      const person = persons.find((p: IPerson) => p.personId === personId);
                      if (!person) return <span key={personId}>(name not found)</span>;
                      return (
                        <span key={person.personId} className="d-flex gap-2">
                          <Competitor person={person} showLocalizedName />
                          {i !== result.personIds.length - 1 && <span>&</span>}
                        </span>
                      );
                    })}
                  </div>
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
                {onEditResult && onDeleteResult && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        id={`edit_result_${(result as any)._id}_button`}
                        onClick={() => onEditResult(result)}
                        loadingId={loadingId}
                        disabled={disableEditAndDelete}
                        className="btn-xs"
                        ariaLabel="Edit"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Button>
                      <Button
                        id={`delete_result_${(result as any)._id}_button`}
                        onClick={() => onDeleteResult((result as any)._id)}
                        loadingId={loadingId}
                        disabled={disableEditAndDelete}
                        className="btn-danger btn-xs"
                        ariaLabel="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
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
