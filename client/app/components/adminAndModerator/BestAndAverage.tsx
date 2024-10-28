"use client";

import { useMemo } from "react";
import Time from "~/app/components/Time.tsx";
import type { ICutoff, IEvent, IFeAttempt, IRecordPair, IRecordType, IResult } from "~/shared_helpers/types.ts";
import { getBestAndAverage, setResultRecords } from "~/shared_helpers/sharedFunctions.ts";
import type { RoundFormat } from "~/shared_helpers/enums.ts";

type Props = {
  event: IEvent;
  roundFormat: RoundFormat;
  attempts: IFeAttempt[];
  recordPairs: IRecordPair[];
  recordTypes: IRecordType[];
  cutoff?: ICutoff;
};

const BestAndAverage = ({ event, roundFormat, attempts, recordPairs, recordTypes, cutoff }: Props) => {
  const pseudoResult = useMemo(() => {
    const { best, average } = getBestAndAverage(attempts, event, roundFormat, { cutoff });
    return setResultRecords({ best, average, attempts, eventId: event.eventId } as IResult, event, recordPairs, true);
  }, [attempts, event, roundFormat, recordPairs, cutoff]);

  return (
    <div>
      <div>
        Best:&nbsp;<Time result={pseudoResult} event={event} recordTypes={recordTypes} />
      </div>
      {attempts.length >= 3 && (
        <div className="mt-2">
          {attempts.length === 5 ? "Average:" : "Mean:"}&nbsp;
          <Time result={pseudoResult} event={event} recordTypes={recordTypes} average />
        </div>
      )}
    </div>
  );
};

export default BestAndAverage;
