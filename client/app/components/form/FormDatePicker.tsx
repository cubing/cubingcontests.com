'use client';

import { useEffect } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import FormInputLabel from './FormInputLabel';
import { getDateOnly } from '@sh/sharedFunctions';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const FormDatePicker = ({
  id,
  title,
  value,
  setValue,
  timeZone = 'UTC',
  dateFormat = 'P',
  timeFormat = 'p',
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
  if (!id && !title) throw new Error('Neither title nor id are set in FormDatePicker');

  const inputId = id || `${title}_date`;
  const showTimeSelect = dateFormat !== 'P';

  useEffect(() => {
    if (!showTimeSelect) setValue(getDateOnly(value));
  }, [showTimeSelect]);

  const onChange = (newDate: Date) => {
    // The time zone conversion is necessary, because otherwise JS uses the user's local time zone
    if (!showTimeSelect) setValue(getDateOnly(fromZonedTime(newDate, timeZone)));
    else setValue(fromZonedTime(newDate, timeZone));
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
        showTimeSelectOnly={dateFormat === 'HH:mm'}
        locale="en-GB"
        disabled={disabled}
        className="form-control"
      />

      {showUTCTime && <div className="mt-3 text-secondary fs-6">UTC:&#8194;{value.toUTCString().slice(0, -4)}</div>}
    </div>
  );
};

export default FormDatePicker;
