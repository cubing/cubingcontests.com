import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Competitor from "~/app/components/Competitor.tsx";
import Solves from "~/app/components/Solves.tsx";
import Time from "~/app/components/Time.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { getIsProceedableResult } from "~/helpers/sharedFunctions.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { ResultResponse } from "~/server/db/schema/results.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";

type Props = {
  event: EventResponse;
  round: RoundResponse;
  results: ResultResponse[];
  persons: PersonResponse[];
  recordConfigs: RecordConfigResponse[];
  onEditResult?: (result: ResultResponse) => void;
  onDeleteResult?: (resultId: number) => void;
  loadingId?: string;
  disableEditAndDelete?: boolean;
};

function RoundResultsTable({
  event,
  round,
  results,
  persons,
  recordConfigs,
  // If one of these is defined, the other must be defined too
  onEditResult,
  onDeleteResult,
  loadingId,
  disableEditAndDelete,
}: Props) {
  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  const roundCanHaveAverage = roundFormat.attempts >= 3;
  let lastRanking = 0;

  // Gets green highlight styling if the result is not DNF/DNS and made podium or is good enough to proceed to the next round
  const getRankingHighlight = (result: ResultResponse) => {
    if (
      result.proceeds ||
      (round.roundTypeId === "f" && result.ranking! <= 3 && getIsProceedableResult(result, roundFormat))
    ) {
      return { color: "black", background: "#10c010" };
    }

    return {};
  };

  if (results.length === 0) return <p className="px-2">There are no results from this round yet</p>;

  return (
    <div className="table-responsive flex-grow-1">
      <table className="table-hover table-responsive table text-nowrap">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Best</th>
            {roundCanHaveAverage && <th scope="col">{round.format === "a" ? "Average" : "Mean"}</th>}
            <th scope="col">Attempts</th>
            {onDeleteResult && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((result: ResultResponse) => {
            const isTie = result.ranking === lastRanking;
            lastRanking = result.ranking!;

            return (
              <tr key={result.id}>
                <td className="ps-2" style={getRankingHighlight(result)}>
                  <span className={isTie ? "text-secondary" : ""}>{result.ranking}</span>
                </td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    {result.personIds.map((personId, i) => {
                      const person = persons.find((p) => p.id === personId);
                      if (!person) return <span key={personId}>(name not found)</span>;
                      return (
                        <span key={person.id} className="d-flex gap-2">
                          <Competitor person={person} showLocalizedName />
                          {i !== result.personIds.length - 1 && <span>&</span>}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <Time result={result} event={event} recordConfigs={recordConfigs} />
                </td>
                {roundCanHaveAverage && (
                  <td>
                    {result.average !== 0 && (
                      <Time result={result} event={event} recordConfigs={recordConfigs} average />
                    )}
                  </td>
                )}
                <td>
                  <Solves event={event} attempts={result.attempts} />
                </td>
                {onEditResult && onDeleteResult && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        id={`edit_result_${result.id}_button`}
                        onClick={() => onEditResult(result)}
                        loadingId={loadingId}
                        disabled={disableEditAndDelete}
                        className="btn-xs"
                        title="Edit"
                        ariaLabel="Edit"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Button>
                      <Button
                        id={`delete_result_${result.id}_button`}
                        onClick={() => onDeleteResult(result.id)}
                        loadingId={loadingId}
                        disabled={disableEditAndDelete}
                        className="btn-danger btn-xs"
                        title="Delete"
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
}

export default RoundResultsTable;
