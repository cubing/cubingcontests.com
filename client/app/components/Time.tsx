import { C } from "~/helpers/constants.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { ResultResponse } from "~/server/db/schema/results.ts";

type Props = {
  result: ResultResponse;
  event: EventResponse;
  recordConfigs: RecordConfigResponse[];
  average?: boolean;
};

function Time({ result, event, recordConfigs, average }: Props) {
  const recordConfig = recordConfigs.find(
    (rc) => (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rc.recordTypeId,
  )!;

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, { event, showMultiPoints: true })}

      {recordConfig && (
        <span
          className={`badge ${recordConfig.color === C.color.warning ? "text-black" : ""}`}
          style={{ fontSize: "0.7rem", backgroundColor: recordConfig.color }}
        >
          {recordConfig.label}
        </span>
      )}
    </div>
  );
}

export default Time;
