import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isSameDay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import Button from "~/app/components/UI/Button.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { getIsOtherActivity } from "~/helpers/sharedFunctions.ts";
import type { Activity, Room } from "~/helpers/types/Schedule.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";
import EventTitle from "./EventTitle.tsx";

type RoomActivity = Activity & { room: Room };
type DayActivity = RoomActivity & {
  formattedStartTime: string;
  formattedEndTime: string;
  isEditable: boolean;
  event?: EventResponse;
  roundTypeLabel?: string;
  roundFormatLabel?: string;
};
type Day = { date: Date; activities: DayActivity[] };

type Props = {
  rooms: Room[];
  events: EventResponse[];
  rounds: Pick<RoundResponse, "eventId" | "roundNumber" | "roundTypeId" | "format">[];
  timeZone: string;
  onDeleteActivity?: (roomId: number, activityId: number) => void;
  onEditActivity?: (roomId: number, activity: Activity) => void;
};

function Schedule({ rooms, events, rounds, timeZone, onDeleteActivity, onEditActivity }: Props) {
  const allActivities: RoomActivity[] = [];

  for (const room of rooms) {
    allActivities.push(
      ...room.activities.map((activity) => ({
        ...activity,
        room,
        startTime: typeof activity.startTime === "string" ? new Date(activity.startTime) : activity.startTime,
        endTime: typeof activity.endTime === "string" ? new Date(activity.endTime) : activity.endTime,
      })),
    );
  }

  allActivities.sort((a, b) => {
    const startDiff = a.startTime.getTime() - b.startTime.getTime();
    if (startDiff === 0) return a.endTime.getTime() - b.endTime.getTime();
    return startDiff;
  });

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
      formattedStartTime: formatInTimeZone(activity.startTime, timeZone, "HH:mm"),
      formattedEndTime:
        (isMultiDayActivity ? `${formatInTimeZone(activity.endTime, timeZone, "dd MMM")} ` : "") +
        formatInTimeZone(activity.endTime, timeZone, "HH:mm"),
      isEditable: true,
    };

    if (!getIsOtherActivity(activity.activityCode)) {
      const [eventId, roundNumber] = dayActivity.activityCode.split("-r");
      dayActivity.event = events.find((e) => e.eventId === eventId);

      if (dayActivity.event) {
        const round = rounds.find((r) => r.eventId === eventId && roundNumber && r.roundNumber === Number(roundNumber));
        if (round) {
          dayActivity.roundTypeLabel = roundTypes[round.roundTypeId].label;
          dayActivity.roundFormatLabel = roundFormats.find((rf) => rf.value === round.format)?.label ?? "ERROR";
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
      {days.length === 0 ? (
        <h5 className="fst-italic text-center">The schedule is currently empty</h5>
      ) : (
        <div className="d-flex flex-column gap-5">
          {days.map((day) => (
            <div key={day.date.toString()}>
              <h4 className="fw-bold mx-2 mb-3">{day.date.toDateString()}</h4>

              <div className="table-responsive flex-grow-1">
                <table className="table-hover table text-nowrap">
                  <thead>
                    <tr>
                      <th scope="col">Start</th>
                      <th scope="col">End</th>
                      <th scope="col">Activity</th>
                      <th scope="col">Room</th>
                      <th scope="col">Format</th>
                      {(onEditActivity || onDeleteActivity) && <th scope="col">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {day.activities.map((a) => (
                      <tr key={`${a.room.id}_${a.id}`}>
                        <td>{a.formattedStartTime}</td>
                        <td>{a.formattedEndTime}</td>
                        <td>
                          {a.activityCode !== "other-misc" ? (
                            <span className="d-flex gap-2 align-items-center">
                              {a.event && (
                                <EventTitle
                                  event={a.event}
                                  fontSize="6"
                                  noMargin
                                  showIcon
                                  showDescription
                                  linkToRankings
                                />
                              )}
                              {a.roundTypeLabel ? (
                                <span>{a.roundTypeLabel}</span>
                              ) : (
                                <>
                                  <span className="fw-bold text-danger">ERROR</span>
                                  <span>({a.activityCode})</span>
                                </>
                              )}
                            </span>
                          ) : (
                            a.name
                          )}
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
                                  onClick={() => onDeleteActivity(a.room.id, a.id)}
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
}

export default Schedule;
