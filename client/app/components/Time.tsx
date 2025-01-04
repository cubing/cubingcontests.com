import { Event, IRecordType, IResult, type IVideoBasedResult } from "@cc/shared";
import { getBSClassFromColor } from "~/helpers/utilityFunctions.ts";
import { getFormattedTime } from "@cc/shared";

type Props = {
  result: IResult | IVideoBasedResult;
  event: Event;
  recordTypes: IRecordType[];
  average?: boolean;
};

const Time = ({ result, event, recordTypes, average }: Props) => {
  const recordType = recordTypes.find(
    (rt) => (average ? result.regionalAverageRecord : result.regionalSingleRecord) === rt.wcaEquivalent,
  ) as IRecordType;

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {getFormattedTime(average ? result.average : result.best, { event, showMultiPoints: true })}

      {recordType && (
        <span className={`badge bg-${getBSClassFromColor(recordType.color)}`} style={{ fontSize: "0.7rem" }}>
          {recordType.label}
        </span>
      )}
    </div>
  );
};

export default Time;
