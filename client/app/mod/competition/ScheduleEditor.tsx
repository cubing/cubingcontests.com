"use client";

import { useMemo, useState } from "react";
import { addHours } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { Color, ContestType } from "~/shared_helpers/enums.ts";
import { IActivity, IContestEvent, IRoom } from "~/shared_helpers/types.ts";
import { MultiChoiceOption } from "~/helpers/types.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { colorOptions } from "~/helpers/multipleChoiceOptions.ts";
import FormDatePicker from "~/app/components/form/FormDatePicker.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import Schedule from "~/app/components/Schedule.tsx";

type Props = {
  rooms: IRoom[];
  setRooms: (val: IRoom[] | ((prev: IRoom[]) => IRoom[])) => void;
  venueTimeZone: string;
  startDate: Date;
  contestType: ContestType;
  contestEvents: IContestEvent[];
  disabled: boolean;
};

const ScheduleEditor = ({
  rooms,
  setRooms,
  venueTimeZone,
  startDate,
  contestType,
  contestEvents,
  disabled,
}: Props) => {
  // Room stuff
  const [roomName, setRoomName] = useState("");
  const [roomColor, setRoomColor] = useState<Color>(Color.White);

  // Activity stuff
  const [activityUnderEdit, setActivityUnderEdit] = useState<IActivity | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  // These are in UTC, but get displayed in the local time zone of the venue. Set to 12:00 - 13:00 by default.
  const [activityStartTime, setActivityStartTime] = useState(fromZonedTime(addHours(startDate, 12), venueTimeZone));
  const [activityEndTime, setActivityEndTime] = useState(fromZonedTime(addHours(startDate, 13), venueTimeZone));

  const roomOptions = useMemo<MultiChoiceOption<number>[]>(
    () => rooms.map((room) => ({ label: room.name, value: room.id })),
    [rooms.length],
  );
  const activityOptions = useMemo(() => {
    const output: MultiChoiceOption[] = [];

    for (const contestEvent of contestEvents) {
      for (const round of contestEvent.rounds) {
        // Add all rounds not already in the schedule and the activity under edit as activity code options
        if (
          activityUnderEdit?.activityCode === round.roundId ||
          !rooms.some((r) => r.activities.some((a) => a.activityCode === round.roundId))
        ) {
          output.push({
            label: `${contestEvent.event.name} ${roundTypes[round.roundTypeId].label}`,
            value: round.roundId,
          });
        }
      }
    }

    output.push({ label: "Custom", value: "other-misc" });
    // Set selected activity code as the first available option, if not editing
    if (activityUnderEdit === null) setActivityCode(output[0].value as string);
    return output;
  }, [contestEvents, rooms, activityUnderEdit]);

  const selectedRoomExists = roomOptions.some((r: MultiChoiceOption) => r.value === selectedRoom);
  if (!selectedRoomExists && roomOptions.length > 0) setSelectedRoom(roomOptions[0].value);
  const isValidActivity = activityCode && (activityCode !== "other-misc" || customActivity) && roomOptions.length > 0;

  const addRoom = () => {
    setRoomName("");
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

  const saveActivity = () => {
    const getFieldsFromInputs = () => ({
      activityCode,
      startTime: activityStartTime,
      endTime: activityEndTime,
      name: activityCode === "other-misc" ? customActivity : undefined,
      childActivities: [] as IActivity[],
    });

    const newRooms = rooms.map((room) =>
      room.id !== selectedRoom ? room : {
        ...room,
        activities: activityUnderEdit
          ? room.activities.map((a) => (a.id === activityUnderEdit.id ? { id: a.id, ...getFieldsFromInputs() } : a))
          : [
            ...room.activities,
            { id: Math.max(...room.activities.map((a) => a.id), 0) + 1, ...getFieldsFromInputs() },
          ],
      }
    );

    setRooms(newRooms);
    setActivityCode("");
    setCustomActivity("");
    setActivityUnderEdit(null);
  };

  const editActivity = (roomId: number, activity: IActivity) => {
    setActivityUnderEdit(activity);
    setSelectedRoom(roomId);
    setActivityCode(activity.activityCode);
    setActivityStartTime(activity.startTime);
    setActivityEndTime(activity.endTime);
    setCustomActivity(activity.name ?? "");
  };

  const cancelEdit = () => {
    setActivityUnderEdit(null);
    setActivityCode("");
    setCustomActivity("");
  };

  const deleteActivity = (roomId: number, activityId: number) => {
    // This syntax is necessary, because this may be called multiple times in the same tick
    setRooms((prev) =>
      prev.map((room) =>
        room.id !== roomId ? room : {
          ...room,
          activities: room.activities.filter((a) => a.id !== activityId),
        }
      )
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
          <div className="col-4 d-flex justify-content-between align-items-end gap-3">
            <div className="flex-grow-1">
              <FormSelect
                title="Color"
                options={colorOptions}
                selected={roomColor}
                setSelected={setRoomColor}
                disabled={disabled}
              />
            </div>
            <ColorSquare color={roomColor} />
          </div>
        </div>
        <Button onClick={addRoom} disabled={disabled || !roomName.trim()} className="btn-success mt-3 mb-2">
          Create
        </Button>
        <hr />

        <h3 className="mb-3">Schedule</h3>

        <div className="row mb-3">
          <div className="col">
            <FormSelect
              title="Room"
              options={roomOptions}
              selected={selectedRoom}
              setSelected={setSelectedRoom}
              disabled={disabled || rooms.length === 0 || activityUnderEdit !== null}
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
        {activityCode === "other-misc" && (
          <FormTextInput
            title="Custom activity"
            value={customActivity}
            setValue={setCustomActivity}
            disabled={disabled}
            className="mb-3"
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
        <div className="d-flex gap-3 mb-4">
          <Button
            onClick={saveActivity}
            disabled={disabled || !isValidActivity}
            className={activityUnderEdit ? "btn-primary" : "btn-success"}
          >
            {activityUnderEdit ? "Update" : "Add to schedule"}
          </Button>
          {activityUnderEdit !== null && <Button onClick={cancelEdit} className="btn-danger">Cancel</Button>}
        </div>
        {contestType === ContestType.WcaComp && (
          <p className="text-center text-danger">
            Please make sure that the schedules match between CC and the WCA.
          </p>
        )}
      </section>

      {/* Bit of a hack to escape the boundaries of the form component to give the schedule more width */}
      <div className="d-flex justify-content-center">
        <div className="min-vw-100">
          <div className="container-md">
            <h1 className="mb-4 text-center">Schedule</h1>

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
