import { IRecordType } from "~/helpers/types.ts";
import { getBSClassFromColor } from "~/helpers/utilityFunctions.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import { EventResponse } from "~/server/db/schema/events.ts";
import { ResultResponse } from "~/server/db/schema/results.ts";

type Props = {
  result: ResultResponse;
  event: EventResponse;
  recordTypes: IRecordType[];
  average?: boolean;
};

function Time({ result, event, recordTypes, average }: Props) {
  const recordType = recordTypes.find((rt) =>
    (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rt.wcaEquivalent
  )!;

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, { event, showMultiPoints: true })}

      {recordType && (
        <span className={`badge bg-${getBSClassFromColor(recordType.color)}`} style={{ fontSize: "0.7rem" }}>
          {recordType.label}
        </span>
      )}
    </div>
  );
}

export default Time;
