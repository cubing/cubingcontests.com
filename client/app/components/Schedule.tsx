import { format, isSameDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { roundFormats } from '@sh/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';
import { IActivity, IContestEvent, IRoom } from '@sh/interfaces';
import EventTitle from './EventTitle';

const Schedule = ({
  rooms,
  contestEvents,
  timezone,
  onDeleteActivity,
}: {
  rooms: IRoom[];
  contestEvents: IContestEvent[];
  timezone: string;
  onDeleteActivity?: (id: number) => void;
}) => {
  const allActivities = [];

  for (const room of rooms) {
    allActivities.push(
      ...room.activities.map((activity) => ({
        ...activity,
        startTime: typeof activity.startTime === 'string' ? new Date(activity.startTime) : activity.startTime,
        endTime: typeof activity.endTime === 'string' ? new Date(activity.endTime) : activity.endTime,
      })),
    );
  }

  allActivities.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const days: {
    date: Date;
    activities: IActivity[];
  }[] = [];

  for (const activity of allActivities) {
    const zonedStartTime = utcToZonedTime(activity.startTime, timezone);

    if (!days.some((el) => isSameDay(utcToZonedTime(el.date, timezone), zonedStartTime))) {
      days.push({ date: zonedStartTime, activities: [] });
    }

    days[days.length - 1].activities.push({
      ...activity,
      startTime: zonedStartTime,
      endTime: utcToZonedTime(activity.endTime, timezone),
    });
  }

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
                  {onDeleteActivity && <th scope="col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {day.activities.map((activity) => {
                  let contestEvent, round;

                  if (activity.activityCode !== 'other-misc') {
                    contestEvent = contestEvents.find((ce) => ce.event.eventId === activity.activityCode.split('-')[0]);
                    if (!contestEvent) throw new Error(`Contest event for activity ${activity.activityCode} not found`);
                    round = contestEvent.rounds.find((r) => r.roundId === activity.activityCode);
                  }

                  return (
                    <tr key={activity.id}>
                      <td>{format(activity.startTime, 'HH:mm')}</td>
                      <td>{format(activity.endTime, 'HH:mm')}</td>
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
                      <td>{rooms.find((room) => room.activities.some((a) => a.id === activity.id)).name}</td>
                      <td>{activity.activityCode !== 'other-misc' && round ? roundFormats[round.format].label : ''}</td>
                      {onDeleteActivity && (
                        <td>
                          <button
                            type="button"
                            onClick={() => onDeleteActivity(activity.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
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
