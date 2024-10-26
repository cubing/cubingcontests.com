"use client";

import { useEffect } from "react";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import FormInputLabel from "./FormInputLabel.tsx";
import { getDateOnly } from "~/shared_helpers/sharedFunctions.ts";

const FormDatetimeInput = ({
  id,
  title = "",
  value,
  setValue,
  timeZone = "UTC",
  showTimeSelect = false,
  // dateFormat = "P",
  // timeIntervals = 10,
  disabled = false,
  showUTCTime = false,
}: {
  id?: string;
  title?: string;
  value: Date;
  setValue: (val: Date) => void;
  timeZone?: string;
  showTimeSelect?: boolean;
  // dateFormat?: string; // P is date select only, Pp is date and time select
  // timeIntervals?: number;
  disabled?: boolean;
  showUTCTime?: boolean;
}) => {
  if (!id && !title) throw new Error("Neither title nor id are set in FormDatetimeInput");

  const inputId = id || `${title}_date`;

  useEffect(() => {
    if (!showTimeSelect) setValue(getDateOnly(value));
  }, [showTimeSelect]);

  const onChange = (newDate: string) => {
    console.log(newDate, typeof newDate);
    // The time zone conversion is necessary, because otherwise JS uses the user's local time zone
    if (!showTimeSelect) {
      setValue(getDateOnly(fromZonedTime(newDate, timeZone)));
    } else setValue(fromZonedTime(newDate, timeZone));
  };

  return (
    <div className="mb-3">
      <FormInputLabel text={title} inputId={inputId} />

      {
        /* <DatePicker
         id={inputId}
         selected={value && toZonedTime(value, timeZone)}
         onChange={onChange}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
         showTimeSelect={showTimeSelect}
         showTimeSelectOnly={dateFormat === "HH:mm"}
         locale="en-GB"
         disabled={disabled}
         className="form-control"
      /> */
      }
      <input
        id={inputId}
        type={showTimeSelect ? "datetime-local" : "date"}
        value={value ? toZonedTime(value, timeZone).toDateString() : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="form-control"
      />

      {showUTCTime && (
        <div className="mt-3 text-secondary fs-6">
          UTC:&#8194;{value.toUTCString().slice(0, -4)}
        </div>
      )}
    </div>
  );
};

export default FormDatetimeInput;
