"use client";

import { useMemo } from "react";
import Time from "~/app/components/Time.tsx";
import { getBestAndAverage, setResultRecords } from "~/helpers/sharedFunctions.ts";
import type { Attempt, ResultResponse } from "~/server/db/schema/results.ts";
import { RoundFormat } from "~/helpers/types.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";

type Props = {
  event: EventResponse;
  roundFormat: RoundFormat;
  attempts: Attempt[];
  recordPairs: IRecordPair[] | undefined;
  recordTypes: IRecordType[];
  cutoff?: ICutoff;
};

function BestAndAverage({ event, roundFormat, attempts, recordPairs, recordTypes, cutoff }: Props) {
  const pseudoResult = useMemo<ResultResponse>(() => {
    const { best, average } = getBestAndAverage(attempts, event, roundFormat, {
      cutoff,
    });
    let tempResult = {
      best,
      average,
      attempts,
      eventId: event.eventId,
    } satisfies ResultResponse;
    if (recordPairs) {
      tempResult = setResultRecords(
        tempResult,
        event,
        recordPairs,
        true,
      ) satisfies ResultResponse;
    }
    return tempResult;
  }, [attempts, event, roundFormat, recordPairs, cutoff]);

  return (
    <div>
      <div>
        Best:&nbsp;<Time
          result={pseudoResult}
          event={event}
          recordTypes={recordTypes}
        />
      </div>
      {attempts.length >= 3 && (
        <div className="mt-2">
          {attempts.length === 5 ? "Average:" : "Mean:"}&nbsp;
          <Time result={pseudoResult} event={event} recordTypes={recordTypes} average />
        </div>
      )}
    </div>
  );
}

export default BestAndAverage;
