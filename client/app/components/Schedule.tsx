import { format, isSameDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { roundFormats } from '@sh/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';
import { IActivity, ICompetitionEvent, IRoom } from '@sh/interfaces';

const Schedule = ({
  rooms,
  compEvents,
  timezone,
}: {
  rooms: IRoom[];
  compEvents: ICompetitionEvent[];
  timezone: string;
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
          <h4 className="mx-2 mb-4 fw-bold">{day.date.toDateString()}</h4>

          <div className="flex-grow-1 mb-5 table-responsive">
            <table className="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Room</th>
                  <th scope="col">Format</th>
                </tr>
              </thead>
              <tbody>
                {day.activities.map((activity) => {
                  let compEvent, round;

                  if (activity.activityCode !== 'other-misc') {
                    compEvent = compEvents.find((ce) => ce.event.eventId === activity.activityCode.split('-')[0]);
                    round = compEvent?.rounds.find((r) => r.roundId === activity.activityCode);
                  }

                  return (
                    <tr key={activity.id}>
                      <td>{format(activity.startTime, 'HH:mm')}</td>
                      <td>{format(activity.endTime, 'HH:mm')}</td>
                      <td>
                        {activity.activityCode !== 'other-misc'
                          ? `${compEvent.event.name} ${roundTypes[round.roundTypeId].label}`
                          : activity.name}
                      </td>
                      <td>{rooms.find((room) => room.activities.some((a) => a.id === activity.id)).name}</td>
                      <td>{activity.activityCode !== 'other-misc' && round ? roundFormats[round.format].label : ''}</td>
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
