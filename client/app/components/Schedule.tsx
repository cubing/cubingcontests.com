import { isSameDay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { IActivity, IContestEvent, IRoom, IRound } from "~/helpers/types.ts";
import { getIsOtherActivity } from "~/helpers/sharedFunctions.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import EventTitle from "./EventTitle.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import Button from "~/app/components/UI/Button.tsx";

type RoomActivity = IActivity & { room: IRoom };
type DayActivity = RoomActivity & {
  formattedStartTime: string;
  formattedEndTime: string;
  isEditable: boolean;
  round?: IRound;
  roundFormatLabel?: string;
  contestEvent?: IContestEvent;
};
type Day = { date: Date; activities: DayActivity[] };

type Props = {
  rooms: IRoom[];
  contestEvents: IContestEvent[];
  timeZone: string;
  onDeleteActivity?: (roomId: number, activityId: number) => void;
  onEditActivity?: (roomId: number, activity: IActivity) => void;
};

const Schedule = ({
  rooms,
  contestEvents,
  timeZone,
  onDeleteActivity,
  onEditActivity,
}: Props) => {
  const allActivities: RoomActivity[] = [];

  for (const room of rooms) {
    allActivities.push(
      ...room.activities.map((activity) => ({
        ...activity,
        room,
        startTime: typeof activity.startTime === "string"
          ? new Date(activity.startTime)
          : activity.startTime,
        endTime: typeof activity.endTime === "string"
          ? new Date(activity.endTime)
          : activity.endTime,
      })),
    );
  }

  allActivities.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const days: Day[] = [];

  for (const activity of allActivities) {
    const zonedStartTime = toZonedTime(activity.startTime, timeZone);
    const zonedEndTime = toZonedTime(activity.endTime, timeZone);

    // Add new day if the activity is on a new day or if the days array is empty
    const lastDay = days.at(-1);
    if (lastDay === undefined || !isSameDay(lastDay.date, zonedStartTime)) {
      days.push({ date: zonedStartTime, activities: [] });
    }

    const isMultiDayActivity = !isSameDay(zonedStartTime, zonedEndTime);
    const dayActivity: DayActivity = {
      ...activity,
      formattedStartTime: formatInTimeZone(
        activity.startTime,
        timeZone,
        "HH:mm",
      ),
      formattedEndTime: (isMultiDayActivity
        ? `${formatInTimeZone(activity.endTime, timeZone, "dd MMM")} `
        : "") +
        formatInTimeZone(activity.endTime, timeZone, "HH:mm"),
      isEditable: true,
    };

    if (!getIsOtherActivity(activity.activityCode)) {
      dayActivity.contestEvent = contestEvents.find(
        (ce) =>
          ce.event.eventId === dayActivity.activityCode.split("-")[0],
      );
      if (dayActivity.contestEvent) {
        dayActivity.round = dayActivity.contestEvent.rounds.find((r) =>
          r.roundId === dayActivity.activityCode
        );
        if (dayActivity.round) {
          dayActivity.roundFormatLabel = roundFormats.find((rf) =>
            rf.value === dayActivity.round?.format
          )?.label;
        } else {
          dayActivity.isEditable = false;
        }
      } else {
        dayActivity.isEditable = false;
      }
    }

    (days.at(-1) as Day).activities.push(dayActivity);
  }

  return (
    <section className="fs-6">
      {days.length === 0
        ? (
          <h5 className="text-center fst-italic">
            The schedule is currently empty
          </h5>
        )
        : (
          <div className="d-flex flex-column gap-5">
            {days.map((day) => (
              <div key={day.date.toString()}>
                <h4 className="mx-2 mb-3 fw-bold">{day.date.toDateString()}</h4>

                <div className="flex-grow-1 table-responsive">
                  <table className="table table-hover text-nowrap">
                    <thead>
                      <tr>
                        <th scope="col">Start</th>
                        <th scope="col">End</th>
                        <th scope="col">Activity</th>
                        <th scope="col">Room</th>
                        <th scope="col">Format</th>
                        {(onEditActivity || onDeleteActivity) && (
                          <th scope="col">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {day.activities.map((a) => (
                        <tr key={`${a.room.id}_${a.id}`}>
                          <td>{a.formattedStartTime}</td>
                          <td>{a.formattedEndTime}</td>
                          <td>
                            {a.activityCode !== "other-misc"
                              ? (
                                <span className="d-flex align-items-center gap-2">
                                  {a.contestEvent && (
                                    <EventTitle
                                      event={a.contestEvent.event}
                                      fontSize="6"
                                      noMargin
                                      showIcon
                                      showDescription
                                      linkToRankings
                                    />
                                  )}
                                  {a.round
                                    ? (
                                      <span>
                                        {roundTypes[a.round.roundTypeId].label}
                                      </span>
                                    )
                                    : (
                                      <>
                                        <span className="text-danger fw-bold">
                                          ERROR
                                        </span>
                                        <span>({a.activityCode})</span>
                                      </>
                                    )}
                                </span>
                              )
                              : a.name}
                          </td>
                          <td>
                            <span className="d-flex gap-3">
                              <ColorSquare
                                color={a.room.color}
                                style={{
                                  height: "1.5rem",
                                  width: "1.8rem",
                                  margin: 0,
                                }}
                              />
                              {a.room.name}
                            </span>
                          </td>
                          <td>{a.roundFormatLabel}</td>
                          {(onEditActivity || onDeleteActivity) && (
                            <td>
                              <div className="d-flex gap-2">
                                {onEditActivity && (
                                  <Button
                                    onClick={() => onEditActivity(a.room.id, a)}
                                    disabled={!a.isEditable}
                                    className="btn-xs"
                                    title="Edit"
                                    ariaLabel="Edit"
                                  >
                                    <FontAwesomeIcon icon={faPencil} />
                                  </Button>
                                )}
                                {onDeleteActivity && (
                                  <Button
                                    onClick={() =>
                                      onDeleteActivity(a.room.id, a.id)}
                                    className="btn-danger btn-xs"
                                    title="Delete"
                                    ariaLabel="Delete"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
    </section>
  );
};

export default Schedule;
