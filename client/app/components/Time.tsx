import React from 'react';
import { getBGClassFromColor, getFormattedTime } from '~/helpers/utilityFunctions';
import { IEvent, IRecordType, IResult } from '~/shared_helpers/interfaces';

const Time = ({
  result,
  event,
  recordTypes,
  average = false,
}: {
  result: IResult;
  event: IEvent;
  recordTypes: IRecordType[];
  average?: boolean;
}) => {
  const recordType = recordTypes.find(
    (rt) => (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rt.wcaEquivalent,
  );

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, { event, showMultiPoints: true })}

      {recordType && (
        <span className={'badge ' + getBGClassFromColor(recordType?.color)} style={{ fontSize: '0.7rem' }}>
          {recordType.label}
        </span>
      )}
    </div>
  );
};

export default Time;
