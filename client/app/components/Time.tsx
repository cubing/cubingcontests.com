import React from 'react';
import { getFormattedTime } from '~/helpers/utilityFunctions';
import { Color } from '~/shared_helpers/enums';
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
  const getRecordBadge = (result: IResult) => {
    const recordType = recordTypes.find(
      (rt) => (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rt.wcaEquivalent,
    );

    if (!recordType) return null;

    let colorClass: string;

    switch (recordType.color) {
      case Color.Red:
        colorClass = 'bg-danger';
        break;
      case Color.Blue:
        colorClass = 'bg-primary';
        break;
      case Color.Green:
        colorClass = 'bg-success';
        break;
      case Color.Yellow:
        colorClass = 'bg-warning';
        break;
      case Color.White:
        colorClass = 'bg-light';
        break;
      case Color.Cyan:
        colorClass = 'bg-info';
        break;
      // The magenta option is skipped, because it is not available in RecordTypesForm
      default:
        colorClass = 'bg-dark';
        console.error(`Unknown record color: ${recordType.color}`);
    }

    return (
      <span className={'badge ' + colorClass} style={{ fontSize: '0.7rem' }}>
        {recordType.label}
      </span>
    );
  };

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, event.format)}
      {getRecordBadge(result)}
    </div>
  );
};

export default Time;
