"use client";

import { addHours, isValid } from "date-fns";
import { getTimezoneOffset } from "date-fns-tz";
import { useMemo, useState } from "react";
import FormDatePicker from "~/app/components/form/FormDatePicker.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Schedule from "~/app/components/Schedule.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { colorOptions } from "~/helpers/multipleChoiceOptions.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { Activity, Room } from "~/helpers/types/Schedule.ts";
import type { ContestType } from "~/helpers/types.ts";
import type { RoundDto } from "~/helpers/validators/Round.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";

type Props = {
  rooms: Room[];
  setRooms: (val: Room[] | ((prev: Room[]) => Room[])) => void;
  venueTimeZone: string;
  startDate: Date;
  contestType: ContestType;
  events: EventResponse[];
  rounds: RoundDto[];
  disabled: boolean;
};

function ScheduleEditor({ rooms, setRooms, venueTimeZone, startDate, contestType, events, rounds, disabled }: Props) {
  // Room stuff
  const [roomName, setRoomName] = useState("");
  const [roomColor, setRoomColor] = useState("#fff");

  // Activity stuff
  const [activityUnderEdit, setActivityUnderEdit] = useState<Activity | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  // These are in UTC, but get displayed in the local time zone of the venue. Set to 12-13:00 by default.
  const [activityStartTime, setActivityStartTime] = useState<Date | undefined>(
    new Date(addHours(startDate, 12).getTime() - getTimezoneOffset(venueTimeZone, startDate)),
  );
  const [activityEndTime, setActivityEndTime] = useState<Date | undefined>(
    new Date(addHours(startDate, 13).getTime() - getTimezoneOffset(venueTimeZone, startDate)),
  );

  const roomOptions = useMemo<MultiChoiceOption<number>[]>(
    () => rooms.map((room) => ({ label: room.name, value: room.id })),
    [rooms],
  );
  const activityOptions = useMemo(() => {
    const output: MultiChoiceOption[] = [];

    for (const round of rounds) {
      const event = events.find((e) => e.eventId === round.eventId)!;
      const activityCode = `${round.eventId}-r${round.roundNumber}`;

      // Add all rounds not already in the schedule and the activity under edit as activity code options
      if (
        activityUnderEdit?.activityCode === activityCode ||
        !rooms.some((r) => r.activities.some((a) => a.activityCode === activityCode))
      ) {
        output.push({
          label: `${event.name} ${roundTypes[round.roundTypeId].label}`,
          value: activityCode,
        });
      }
    }

    output.push({ label: "Custom", value: "other-misc" });
    // Set selected activity code as the first available option, if not editing
    if (activityUnderEdit === null) setActivityCode(output[0].value as string);
    return output;
  }, [events, rounds, rooms, activityUnderEdit]);

  const selectedRoomExists = roomOptions.some((r: MultiChoiceOption) => r.value === selectedRoom);
  if (!selectedRoomExists && roomOptions.length > 0) {
    setSelectedRoom(roomOptions[0].value);
  }
  const isValidActivity =
    activityCode &&
    (activityCode !== "other-misc" || customActivity) &&
    roomOptions.length > 0 &&
    isValid(activityStartTime) &&
    isValid(activityEndTime);

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

  const changeActivityStartTime = (newTime: Date | undefined) => {
    setActivityStartTime(newTime);

    if (isValid(newTime) && isValid(activityStartTime) && isValid(activityEndTime)) {
      // Change the activity end time too
      const activityLength = activityEndTime!.getTime() - activityStartTime!.getTime();
      setActivityEndTime(new Date(newTime!.getTime() + activityLength));
    }
  };

  const saveActivity = () => {
    const getFieldsFromInputs = () => ({
      activityCode,
      startTime: activityStartTime!,
      endTime: activityEndTime!,
      name: activityCode === "other-misc" ? customActivity : undefined,
      childActivities: [] as Activity[],
    });

    const newRooms = rooms.map((room) =>
      room.id !== selectedRoom
        ? room
        : {
            ...room,
            activities: activityUnderEdit
              ? room.activities.map((a) => (a.id === activityUnderEdit.id ? { id: a.id, ...getFieldsFromInputs() } : a))
              : [
                  ...room.activities,
                  { id: Math.max(...room.activities.map((a) => a.id), 0) + 1, ...getFieldsFromInputs() },
                ],
          },
    );

    setRooms(newRooms);
    setActivityCode("");
    setCustomActivity("");
    setActivityUnderEdit(null);
  };

  const editActivity = (roomId: number, activity: Activity) => {
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
        room.id !== roomId ? room : { ...room, activities: room.activities.filter((a) => a.id !== activityId) },
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
          <div className="d-flex justify-content-between col-4 gap-3 align-items-end">
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
          <div className="col-12 col-md-6">
            <FormSelect
              title="Room"
              options={roomOptions}
              selected={selectedRoom}
              setSelected={setSelectedRoom}
              disabled={disabled || rooms.length === 0 || activityUnderEdit !== null}
            />
          </div>
          <div className="col-12 col-md-6">
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
        <div className="row mb-3 align-items-end">
          <div className="col-12 col-md-6">
            <FormDatePicker
              id="activity_start_time"
              title={`Start time (${venueTimeZone})`}
              value={activityStartTime}
              setValue={changeActivityStartTime}
              timezone={venueTimeZone}
              dateFormat="Pp"
              timeIntervals={5}
              disabled={disabled}
              showUTCTime
            />
          </div>
          <div className="col-12 col-md-6">
            <FormDatePicker
              id="activity_end_time"
              title="End time"
              value={activityEndTime}
              setValue={setActivityEndTime}
              timezone={venueTimeZone}
              dateFormat="Pp"
              timeIntervals={5}
              disabled={disabled}
              showUTCTime
            />
          </div>
        </div>
        <div className="d-flex mb-4 gap-3">
          <Button
            onClick={saveActivity}
            disabled={disabled || !isValidActivity}
            className={activityUnderEdit ? "btn-primary" : "btn-success"}
          >
            {activityUnderEdit ? "Update" : "Add to schedule"}
          </Button>
          {activityUnderEdit !== null && (
            <Button onClick={cancelEdit} className="btn-danger">
              Cancel
            </Button>
          )}
        </div>
        {contestType === "wca-comp" && (
          <p className="text-center text-danger">Please make sure that the schedules match between CC and the WCA.</p>
        )}
      </section>

      {/* Bit of a hack to escape the boundaries of the form component to give the schedule more width */}
      <div className="d-flex justify-content-center">
        <div className="min-vw-100">
          <div className="container-md">
            <h1 className="mb-4 text-center">Schedule</h1>

            <Schedule
              rooms={rooms}
              events={events}
              rounds={rounds}
              timezone={venueTimeZone}
              onEditActivity={disabled ? undefined : editActivity}
              onDeleteActivity={disabled ? undefined : deleteActivity}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ScheduleEditor;
