"use client";

import { useMemo } from "react";
import Time from "~/app/components/Time.tsx";
import type { Event, ICutoff, IFeAttempt, IRecordPair, IRecordType, IResult } from "~/helpers/types.ts";
import { getBestAndAverage, setResultRecords } from "~/helpers/sharedFunctions.ts";
import type { RoundFormat } from "~/helpers/enums.ts";

type Props = {
  event: Event;
  roundFormat: RoundFormat;
  attempts: IFeAttempt[];
  recordPairs: IRecordPair[] | undefined;
  recordTypes: IRecordType[];
  cutoff?: ICutoff;
};

const BestAndAverage = (
  { event, roundFormat, attempts, recordPairs, recordTypes, cutoff }: Props,
) => {
  const pseudoResult = useMemo<IResult>(() => {
    const { best, average } = getBestAndAverage(attempts, event, roundFormat, {
      cutoff,
    });
    let tempResult = {
      best,
      average,
      attempts,
      eventId: event.eventId,
    } as IResult;
    if (recordPairs) {
      tempResult = setResultRecords(
        tempResult,
        event,
        recordPairs,
        true,
      ) as IResult;
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
          <Time
            result={pseudoResult}
            event={event}
            recordTypes={recordTypes}
            average
          />
        </div>
      )}
    </div>
  );
};

export default BestAndAverage;
