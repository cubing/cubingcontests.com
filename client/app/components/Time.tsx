import { C } from "~/helpers/constants.ts";
import { getAlwaysShowDecimals, getFormattedTime } from "~/helpers/utility-functions.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { ResultResponse } from "~/server/db/schema/results.ts";

type Props = {
  result: ResultResponse;
  event: EventResponseWithCategory;
  recordConfigs: RecordConfigResponse[];
  average?: boolean;
};

function Time({ result, event, recordConfigs, average }: Props) {
  const recordConfig = recordConfigs.find(
    (rc) => (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rc.recordTypeId,
  )!;

  return (
    <div className="d-inline-flex gap-2 align-items-center">
      {getFormattedTime(average ? result.average : result.best, {
        eventFormat: event.format,
        showDecimals: getAlwaysShowDecimals(event) ? "up-to-1h" : "default",
        showMultiPoints: true,
        isAverage: average,
      })}

      {recordConfig?.active && (
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
