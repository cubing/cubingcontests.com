import { isSameDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import EventTitle from './EventTitle';
import ColorSquare from '@c/UI/ColorSquare';
import { roundFormats } from '@sh/roundFormats';
import { IActivity, IContestEvent, IRoom, IRound } from '@sh/types';
import { roundTypes } from '~/helpers/roundTypes';
import Button from '~/app/components/UI/Button';

type RoomActivity = IActivity & { room: IRoom };

const Schedule = ({
  rooms,
  contestEvents,
  timeZone,
  onDeleteActivity,
  onEditActivity,
}: {
  rooms: IRoom[];
  contestEvents: IContestEvent[];
  timeZone: string;
  onDeleteActivity?: (roomId: number, activityId: number) => void;
  onEditActivity?: (roomId: number, activity: IActivity) => void;
}) => {
  const allActivities: RoomActivity[] = [];

  for (const room of rooms) {
    allActivities.push(
      ...room.activities.map((activity) => ({
        ...activity,
        room,
        startTime: typeof activity.startTime === 'string' ? new Date(activity.startTime) : activity.startTime,
        endTime: typeof activity.endTime === 'string' ? new Date(activity.endTime) : activity.endTime,
      })),
    );
  }

  allActivities.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const days: {
    date: Date;
    activities: (RoomActivity & {
      formattedStartTime: string;
      formattedEndTime: string;
    })[];
  }[] = [];

  for (const activity of allActivities) {
    const zonedStartTime = toZonedTime(activity.startTime, timeZone);
    const zonedEndTime = toZonedTime(activity.endTime, timeZone);

    // Add new day if the activity is on a new day or if the days array is empty
    if (days.length === 0 || !isSameDay(days.at(-1).date, zonedStartTime))
      days.push({ date: zonedStartTime, activities: [] });

    const isMultiDayActivity = !isSameDay(zonedStartTime, zonedEndTime);

    days.at(-1).activities.push({
      ...activity,
      formattedStartTime: formatInTimeZone(activity.startTime, timeZone, 'HH:mm'),
      formattedEndTime:
        (isMultiDayActivity ? `${formatInTimeZone(activity.endTime, timeZone, 'dd MMM')} ` : '') +
        formatInTimeZone(activity.endTime, timeZone, 'HH:mm'),
    });
  }

  const getIsEditableActivity = (activityCode: string) => {
    if (/^other-/.test(activityCode)) return true;

    for (const contestEvent of contestEvents) {
      if (contestEvent.event.eventId === activityCode.split('-')[0]) {
        const round = contestEvent.rounds.find((r) => r.roundId === activityCode);
        return round.results.length === 0;
      }
    }
    throw new Error(`Round for activity ${activityCode} not found`);
  };

  return (
    <>
      <h1 className="mb-4 text-center">Schedule</h1>

      {days.map((day) => (
        <div key={day.date.toString()}>
          <h4 className="mx-2 mb-3 fw-bold">{day.date.toDateString()}</h4>

          <div className="flex-grow-1 mb-5 table-responsive">
            <table className="table table-hover text-nowrap">
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
                {day.activities.map((activity) => {
                  let contestEvent: IContestEvent, round: IRound;

                  if (activity.activityCode !== 'other-misc') {
                    contestEvent = contestEvents.find((ce) => ce.event.eventId === activity.activityCode.split('-')[0]);
                    if (!contestEvent) throw new Error(`Contest event for activity ${activity.activityCode} not found`);
                    round = contestEvent.rounds.find((r) => r.roundId === activity.activityCode);
                  }

                  return (
                    <tr key={`${activity.room.id}_${activity.id}`}>
                      <td>{activity.formattedStartTime}</td>
                      <td>{activity.formattedEndTime}</td>
                      <td>
                        {activity.activityCode !== 'other-misc' ? (
                          <span className="d-flex gap-1">
                            <EventTitle event={contestEvent.event} fontSize="6" noMargin showIcon />
                            <span>{roundTypes[round.roundTypeId].label}</span>
                          </span>
                        ) : (
                          activity.name
                        )}
                      </td>
                      <td>
                        <span className="d-flex gap-3">
                          <ColorSquare
                            color={activity.room.color}
                            style={{ height: '1.5rem', width: '1.8rem', margin: 0 }}
                          />
                          {activity.room.name}
                        </span>
                      </td>
                      <td>
                        {activity.activityCode !== 'other-misc' && round
                          ? roundFormats.find((rf) => rf.value === round.format).label
                          : ''}
                      </td>
                      {(onEditActivity || onDeleteActivity) && (
                        <td>
                          <div className="d-flex gap-2">
                            {onEditActivity && (
                              <Button
                                text="Edit"
                                onClick={() => onEditActivity(activity.room.id, activity)}
                                disabled={!getIsEditableActivity(activity.activityCode)}
                                className="btn-sm"
                              />
                            )}
                            {onDeleteActivity && (
                              <Button
                                text="Delete"
                                onClick={() => onDeleteActivity(activity.room.id, activity.id)}
                                disabled={!getIsEditableActivity(activity.activityCode)}
                                className="btn-danger btn-sm"
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
};

export default Schedule;
