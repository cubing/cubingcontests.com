'use client';

import { useMemo, useState } from 'react';
import { addHours } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { Color } from '@sh/enums';
import { IActivity, IContestEvent, IRoom } from '@sh/types';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import { roundTypes } from '~/helpers/roundTypes';
import { colorOptions } from '~/helpers/multipleChoiceOptions';
import FormDatePicker from '@c/form/FormDatePicker';
import FormSelect from '@c/form/FormSelect';
import FormTextInput from '@c/form/FormTextInput';
import Button from '@c/UI/Button';
import ColorSquare from '@c/UI/ColorSquare';
import Schedule from '@c/Schedule';

const ScheduleEditor = ({
  rooms,
  setRooms,
  venueTimeZone,
  startDate,
  contestEvents,
  disabled,
}: {
  rooms: IRoom[];
  setRooms: (val: IRoom[] | ((prev: IRoom[]) => IRoom[])) => void;
  venueTimeZone: string;
  startDate: Date;
  contestEvents: IContestEvent[];
  disabled: boolean;
}) => {
  const [roomName, setRoomName] = useState('');
  const [roomColor, setRoomColor] = useState<Color>(Color.White);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  // These are in UTC, but get displayed in the local time zone of the venue. Set to 12:00 - 13:00 by default.
  const [activityStartTime, setActivityStartTime] = useState(fromZonedTime(addHours(startDate, 12), venueTimeZone));
  const [activityEndTime, setActivityEndTime] = useState(fromZonedTime(addHours(startDate, 13), venueTimeZone));

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.name,
        value: room.id,
      })),
    [rooms.length],
  );
  const activityOptions = useMemo(() => {
    const output: MultiChoiceOption[] = [];

    for (const contestEvent of contestEvents) {
      for (const round of contestEvent.rounds) {
        // Add all rounds not already added to the schedule as activity code options
        if (!rooms.some((r) => r.activities.some((a) => a.activityCode === round.roundId))) {
          output.push({
            label: `${contestEvent.event.name} ${roundTypes[round.roundTypeId].label}`,
            value: round.roundId,
          });
        }
      }
    }

    output.push({ label: 'Custom', value: 'other-misc' });
    setActivityCode(output[0].value as string); // set selected activity code as the first available option
    return output;
  }, [contestEvents, rooms]);

  const selectedRoomExists = roomOptions.some((r) => r.value === selectedRoom);
  if (!selectedRoomExists && roomOptions.length > 0) setSelectedRoom(roomOptions[0].value);
  const isValidActivity = activityCode && (activityCode !== 'other-misc' || customActivity) && roomOptions.length > 0;

  const addRoom = () => {
    setRoomName('');
    setRooms([
      ...rooms,
      {
        id: rooms.length === 0 ? 1 : rooms.reduce((prev, curr) => (curr.id > prev.id ? curr : prev)).id + 1,
        name: roomName.trim(),
        color: roomColor,
        activities: [],
      },
    ]);
  };

  const changeActivityStartTime = (newTime: Date) => {
    setActivityStartTime(newTime);

    if (newTime) {
      // Change the activity end time too
      const activityLength = activityEndTime.getTime() - activityStartTime.getTime();
      setActivityEndTime(new Date(newTime.getTime() + activityLength));
    }
  };

  const addActivity = () => {
    const newRooms = rooms.map((room) =>
      room.id !== selectedRoom
        ? room
        : {
            ...room,
            activities: [
              ...room.activities,
              {
                // Gets the current highest ID + 1
                id:
                  room.activities.length === 0
                    ? 1
                    : room.activities.reduce((prev, curr) => (curr.id > prev.id ? curr : prev)).id + 1,
                activityCode,
                name: activityCode === 'other-misc' ? customActivity : undefined,
                startTime: activityStartTime,
                endTime: activityEndTime,
                childActivities: [],
              },
            ],
          },
    );

    setRooms(newRooms);
    setActivityCode('');
    setCustomActivity('');
  };

  // Simply deletes the activity and copies the values to the inputs
  const editActivity = (roomId: number, activity: IActivity) => {
    deleteActivity(roomId, activity.id);
    setActivityCode(activity.activityCode);
    setActivityStartTime(activity.startTime);
    setActivityEndTime(activity.endTime);
    setCustomActivity(activity.name ?? '');
  };

  const deleteActivity = (roomId: number, activityId: number) => {
    // This syntax is necessary, because this may be called multiple times in the same tick
    setRooms((prev) =>
      prev.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              activities: room.activities.filter((a) => a.id !== activityId),
            },
      ),
    );
  };

  return (
    <>
      <section>
        <h3 className="mb-3">Rooms</h3>

        <div className="row">
          <div className="col-8">
            <FormTextInput title="Room name" value={roomName} setValue={setRoomName} disabled={disabled} />
          </div>
          <div className="col-4 d-flex justify-content-between align-items-end gap-3 mb-3">
            <div className="flex-grow-1">
              <FormSelect
                title="Color"
                options={colorOptions}
                selected={roomColor}
                setSelected={setRoomColor}
                disabled={disabled}
                noMargin
              />
            </div>
            <ColorSquare color={roomColor} />
          </div>
        </div>
        <Button
          text="Create"
          className="mt-3 mb-2 btn-success"
          onClick={addRoom}
          disabled={disabled || !roomName.trim()}
        />
        <hr />
        <h3 className="mb-3">Schedule</h3>
        <div className="row">
          <div className="col">
            <FormSelect
              title="Room"
              options={roomOptions}
              selected={selectedRoom}
              setSelected={setSelectedRoom}
              disabled={disabled || rooms.length === 0}
            />
          </div>
          <div className="col">
            <FormSelect
              title="Activity"
              options={activityOptions}
              selected={activityCode}
              setSelected={setActivityCode}
              disabled={disabled || !selectedRoom}
            />
          </div>
        </div>
        {activityCode === 'other-misc' && (
          <FormTextInput
            title="Custom activity"
            value={customActivity}
            setValue={setCustomActivity}
            disabled={disabled}
          />
        )}
        <div className="mb-3 row align-items-end">
          <div className="col">
            <FormDatePicker
              id="activity_start_time"
              title={`Start time (${venueTimeZone})`}
              value={activityStartTime}
              setValue={changeActivityStartTime}
              timeZone={venueTimeZone}
              dateFormat="Pp"
              timeIntervals={5}
              disabled={disabled}
              showUTCTime
            />
          </div>
          <div className="col">
            <FormDatePicker
              id="activity_end_time"
              value={activityEndTime}
              setValue={setActivityEndTime}
              timeZone={venueTimeZone}
              dateFormat="Pp"
              timeIntervals={5}
              disabled={disabled}
              showUTCTime
            />
          </div>
        </div>
        <Button
          text="Add to schedule"
          className="mt-3 mb-2 btn-success"
          disabled={disabled || !isValidActivity}
          onClick={addActivity}
        />
      </section>

      {/* Bit of a hack to escape the boundaries of the form component to give the schedule more width */}
      <div className="d-flex justify-content-center">
        <div className="min-vw-100">
          <div className="container-md">
            <Schedule
              rooms={rooms}
              contestEvents={contestEvents}
              timeZone={venueTimeZone}
              onEditActivity={disabled ? undefined : editActivity}
              onDeleteActivity={disabled ? undefined : deleteActivity}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduleEditor;
