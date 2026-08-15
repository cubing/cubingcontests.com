"use client";

import { useMemo } from "react";
import Time from "~/app/components/Time.tsx";
import type { EventWrPair, RoundFormat } from "~/helpers/types.ts";
import { getBestAndAverage, setResultWorldRecords } from "~/helpers/utility-functions.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { Attempt, ResultResponse } from "~/server/db/schema/results.ts";

type Props = {
  event: EventResponseWithCategory;
  roundFormat: RoundFormat;
  attempts: Attempt[];
  eventWrPair: EventWrPair | undefined;
  recordConfigs: RecordConfigResponse[];
};

function BestAndAverage({ event, roundFormat, attempts, eventWrPair, recordConfigs }: Props) {
  const pseudoResult = useMemo<ResultResponse>(() => {
    const { best, average } = getBestAndAverage(attempts, event, roundFormat);
    let tempResult = { best, average, attempts, eventId: event.eventId } as ResultResponse;
    if (eventWrPair) tempResult = setResultWorldRecords(tempResult, event, eventWrPair);
    return tempResult;
  }, [attempts, event, roundFormat, eventWrPair]);

  return (
    <div>
      <div>
        Best:&nbsp;
        <Time result={pseudoResult} event={event} recordConfigs={recordConfigs} />
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
