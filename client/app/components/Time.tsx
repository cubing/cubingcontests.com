import { IEvent, IRecordType, IResult, type ISubmittedResult } from "~/shared_helpers/types.ts";
import { getBSClassFromColor } from "~/helpers/utilityFunctions.ts";
import { getFormattedTime } from "~/shared_helpers/sharedFunctions.ts";

const Time = ({ result, event, recordTypes, average }: {
  result: IResult | ISubmittedResult;
  event: IEvent;
  recordTypes: IRecordType[];
  average?: boolean;
}) => {
  const recordType = recordTypes.find(
    (rt) =>
      (average ? result.regionalAverageRecord : result.regionalSingleRecord) ===
        rt.wcaEquivalent,
  );

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, {
        event,
        showMultiPoints: true,
      })}

      {recordType && (
        <span
          className={`badge bg-${getBSClassFromColor(recordType?.color)}`}
          style={{ fontSize: "0.7rem" }}
        >
          {recordType.label}
        </span>
      )}
    </div>
  );
};

export default Time;
