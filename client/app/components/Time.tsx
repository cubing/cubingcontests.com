import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import { EventResponse } from "~/server/db/schema/events.ts";
import { ResultResponse } from "~/server/db/schema/results.ts";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";

type Props = {
  result: ResultResponse;
  event: EventResponse;
  recordConfigs: RecordConfigResponse[];
  average?: boolean;
};

function Time({ result, event, recordConfigs, average }: Props) {
  const recordConfig = recordConfigs.find((rc) =>
    (average ? (result.averageRecordTypes ?? []) : (result.singleRecordTypes ?? [])).includes(rc.recordTypeId)
  )!;

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, { event, showMultiPoints: true })}

      {recordConfig && (
        <span
          className={`badge ${recordConfig.color === "#ffc107" ? "text-black" : ""}`}
          style={{ fontSize: "0.7rem", backgroundColor: recordConfig.color }}
        >
          {recordConfig.label}
        </span>
      )}
    </div>
  );
}

export default Time;
