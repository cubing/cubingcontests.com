"use client";

import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isValid } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getDateOnly } from "~/helpers/sharedFunctions.ts";
import FormInputLabel from "./FormInputLabel.tsx";

registerLocale("en-GB", enGB);
setDefaultLocale("en-GB");

type Props = {
  id?: string;
  title?: string;
  value: Date | undefined;
  setValue: (val: Date | undefined) => void;
  timezone?: string;
  dateFormat?: string; // P is date select only, Pp is date and time select
  timeFormat?: string;
  timeIntervals?: number;
  disabled?: boolean;
  showUTCTime?: boolean;
};

function FormDatePicker({
  id,
  title,
  value,
  setValue,
  timezone = "UTC",
  dateFormat = "P",
  timeFormat = "p",
  timeIntervals = 10,
  disabled = false,
  showUTCTime = false,
}: Props) {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormDatePicker");
  }

  const inputId = id || `${title}_date`;
  const showTimeSelect = dateFormat !== "P";

  const onChange = (newDate: Date) => {
    // The time zone conversion is necessary, because otherwise JS uses the user's local time zone
    if (!showTimeSelect) {
      setValue(getDateOnly(fromZonedTime(newDate, timezone))!);
    } else {
      setValue(fromZonedTime(newDate, timezone));
    }
  };

  return (
    <div className="mb-3">
      {title && <FormInputLabel text={title} inputId={inputId} />}

      <DatePicker
        id={inputId}
        selected={isValid(value) && toZonedTime(value!, timezone)}
        onChange={onChange}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        showTimeSelect={showTimeSelect}
        showTimeSelectOnly={dateFormat === "HH:mm"}
        locale="en-GB"
        disabled={disabled}
        className="form-control mt-2"
      />

      {showUTCTime && (
        <div className="fs-6 mt-3 text-secondary">UTC:&#8194;{value?.toUTCString().slice(0, -4) ?? "?"}</div>
      )}
    </div>
  );
}

export default FormDatePicker;
