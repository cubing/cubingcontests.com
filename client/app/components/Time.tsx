import React from 'react';
import { getBGClassFromColor, getFormattedTime } from '~/helpers/utilityFunctions';
import { IEvent, IRecordType, IResult } from '~/shared_helpers/interfaces';
import { getAlwaysShowDecimals } from '~/shared_helpers/sharedFunctions';

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

  console.log(getAlwaysShowDecimals(event));

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, {
        eventFormat: event.format,
        alwaysShowDecimals: getAlwaysShowDecimals(event),
        showMultiPoints: true,
      })}

      {recordType && (
        <span className={'badge ' + getBGClassFromColor(recordType?.color)} style={{ fontSize: '0.7rem' }}>
          {recordType.label}
        </span>
      )}
    </div>
  );
};

export default Time;
