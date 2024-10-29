"use client";

import { useEffect } from "react";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enGB } from "date-fns/locale/en-GB";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import FormInputLabel from "./FormInputLabel.tsx";
import { getDateOnly } from "../../../shared_helpers/sharedFunctions.ts";

registerLocale("en-GB", enGB);
setDefaultLocale("en-GB");

const FormDatePicker = ({
  id,
  title,
  value,
  setValue,
  timeZone = "UTC",
  dateFormat = "P",
  timeFormat = "p",
  timeIntervals = 10,
  disabled = false,
  showUTCTime = false,
}: {
  id?: string;
  title?: string;
  value: Date;
  setValue: (val: Date) => void;
  timeZone?: string;
  dateFormat?: string; // P is date select only, Pp is date and time select
  timeFormat?: string;
  timeIntervals?: number;
  disabled?: boolean;
  showUTCTime?: boolean;
}) => {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormDatePicker");
  }

  const inputId = id || `${title}_date`;
  const showTimeSelect = dateFormat !== "P";

  useEffect(() => {
    if (!showTimeSelect) setValue(getDateOnly(value) as Date);
  }, [showTimeSelect]);

  const onChange = (newDate: Date) => {
    // The time zone conversion is necessary, because otherwise JS uses the user's local time zone
    if (!showTimeSelect) {
      setValue(getDateOnly(fromZonedTime(newDate, timeZone)) as Date);
    } else setValue(fromZonedTime(newDate, timeZone));
  };

  return (
    <div className="mb-3">
      <FormInputLabel text={title} inputId={inputId} />

      <DatePicker
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
      />

      {showUTCTime && (
        <div className="mt-3 text-secondary fs-6">
          UTC:&#8194;{value ? value.toUTCString().slice(0, -4) : "ERROR"}
        </div>
      )}
    </div>
  );
};

export default FormDatePicker;
