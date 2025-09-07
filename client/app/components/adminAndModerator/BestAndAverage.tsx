"use client";

import { useMemo } from "react";
import Time from "~/app/components/Time.tsx";
import { getBestAndAverage, setResultWorldRecords } from "~/helpers/sharedFunctions.ts";
import type { Attempt, ResultResponse } from "~/server/db/schema/results.ts";
import { RecordPair, RoundFormat } from "~/helpers/types.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";

type Props = {
  event: EventResponse;
  roundFormat: RoundFormat;
  attempts: Attempt[];
  eventWrPair: RecordPair | undefined;
  recordConfigs: RecordConfigResponse[];
  // cutoff?: ICutoff;
};

function BestAndAverage({
  event,
  roundFormat,
  attempts,
  eventWrPair,
  recordConfigs,
  // cutoff
}: Props) {
  const pseudoResult = useMemo<ResultResponse>(() => {
    const { best, average } = getBestAndAverage(attempts, event, roundFormat, {
      // cutoff,
    });
    let tempResult = { best, average, attempts, eventId: event.eventId } as ResultResponse;
    if (eventWrPair) tempResult = setResultWorldRecords(tempResult, event, eventWrPair, true) as ResultResponse;
    return tempResult;
  }, [attempts, event, roundFormat, eventWrPair]);
  // }, [attempts, event, roundFormat, wrRecordPair, cutoff]);

  return (
    <div>
      <div>
        Best:&nbsp;<Time
          result={pseudoResult}
          event={event}
          recordConfigs={recordConfigs}
        />
      </div>
      {attempts.length >= 3 && (
        <div className="mt-2">
          {attempts.length === 5 ? "Average:" : "Mean:"}&nbsp;
          <Time result={pseudoResult} event={event} recordConfigs={recordConfigs} average />
        </div>
      )}
    </div>
  );
}

export default BestAndAverage;
