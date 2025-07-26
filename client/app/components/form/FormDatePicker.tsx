"use client";

import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enGB } from "date-fns/locale/en-GB";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import FormInputLabel from "./FormInputLabel.tsx";
import { getDateOnly } from "~/helpers/sharedFunctions.ts";
import { isValid } from "date-fns";

registerLocale("en-GB", enGB);
setDefaultLocale("en-GB");

type Props = {
  id?: string;
  title?: string;
  value: Date | undefined;
  setValue: (val: Date | undefined) => void;
  timeZone?: string;
  dateFormat?: string; // P is date select only, Pp is date and time select
  timeFormat?: string;
  timeIntervals?: number;
  disabled?: boolean;
  showUTCTime?: boolean;
};

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
}: Props) => {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormDatePicker");
  }

  const inputId = id || `${title}_date`;
  const showTimeSelect = dateFormat !== "P";

  const onChange = (newDate: Date) => {
    // The time zone conversion is necessary, because otherwise JS uses the user's local time zone
    if (!showTimeSelect) {
      setValue(getDateOnly(fromZonedTime(newDate, timeZone))!);
    } else {
      setValue(fromZonedTime(newDate, timeZone));
    }
  };

  return (
    <div className="mb-3">
      {title && <FormInputLabel text={title} inputId={inputId} />}

      <DatePicker
        id={inputId}
        selected={isValid(value) && toZonedTime(value!, timeZone)}
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
        <div className="mt-3 text-secondary fs-6">
          UTC:&#8194;{value?.toUTCString().slice(0, -4) ?? "?"}
        </div>
      )}
    </div>
  );
};

export default FormDatePicker;
