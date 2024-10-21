'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { isValid, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import C from '~/shared_helpers/constants.ts';
import { genericOnKeyDown } from '~/helpers/utilityFunctions.ts';

const FormDateInput = ({
  id,
  title,
  value,
  setValue,
  disabled,
  nextFocusTargetId,
}: {
  id?: string;
  title: string;
  value: Date | null | undefined; // null means the date is invalid; undefined means it's empty
  setValue: (val: Date | null | undefined) => void;
  disabled?: boolean;
  nextFocusTargetId?: string;
}) => {
  const [dateText, setDateText] = useState('');
  const [position, setPosition] = useState(0);

  const prettyDate = useMemo(() => {
    let prettyDate = '';

    for (let i = 0; i < 10; i++) {
      if (i === 2 || i === 5) {
        prettyDate += '.';
      } else {
        let digit;
        if (i < 2 && dateText.length > i) digit = dateText[i];
        else if ([3, 4].includes(i) && dateText.length > i - 1) {
          digit = dateText[i - 1];
        } else if (i > 5 && dateText.length > i - 2) digit = dateText[i - 2];
        prettyDate += digit || '_';
      }
    }

    return prettyDate;
  }, [dateText]);

  const inputId = id || `${title}_date`;

  useEffect(() => {
    if (value) {
      setDateText(formatInTimeZone(value, 'UTC', 'ddMMyyyy'));
    } else if (value === undefined && dateText !== '') {
      setDateText('');
    }
  }, [value]);

  useEffect(() => {
    changeCursorPosition();
  }, [dateText, position]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const onChange = (e: any) => {
    const offset = position >= 6 ? 2 : position >= 3 ? 1 : 0;

    // Backspace detection
    if (e.target.value.length < prettyDate.length) {
      if (position > 0) {
        const newDateText = dateText.slice(0, position - offset - 1) +
          dateText.slice(position - offset);
        setDateText(newDateText);

        if (newDateText) setValue(null);
        else setValue(undefined);

        changePosition({ change: -1, dateTextLength: newDateText.length });
      }
    } // New digit detection
    else if (e.target.value.length > prettyDate.length) {
      if (dateText.length < 8) {
        const newCharacter = e.target.value[e.target.selectionStart - 1];

        if (/[0-9]/.test(newCharacter)) {
          const newDateText = dateText.slice(0, position - offset) +
            newCharacter + dateText.slice(position - offset);
          setDateText(newDateText);

          if (newDateText.length < 8) {
            setValue(null);
          } else {
            const parsed = parseISO(
              `${newDateText.slice(4)}-${newDateText.slice(2, 4)}-${newDateText.slice(0, 2)}`,
            );
            // The conversion is necessary, because otherwise JS uses the user's local time zone
            setValue(isValid(parsed) ? fromZonedTime(parsed, 'UTC') : null);
          }

          changePosition({ change: 1, dateTextLength: newDateText.length });
        }
      }
    }
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      genericOnKeyDown(e, { nextFocusTargetId });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changePosition({ change: -1 });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      changePosition({ change: 1 });
    } else if (C.navigationKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const changePosition = ({
    change,
    newPosition,
    dateTextLength = dateText.length,
  }: {
    change?: number;
    newPosition?: number;
    dateTextLength?: number;
  } = {}) => {
    if (newPosition === undefined) {
      const offset = dateTextLength >= 4 ? 2 : dateTextLength >= 2 ? 1 : 0;

      if (change !== undefined) {
        newPosition = Math.min(
          Math.max(position + change, 0),
          dateTextLength + offset,
        );

        // Skip over dots
        if (change > 0 && [2, 5].includes(newPosition)) newPosition++;
        if (change < 0 && [2, 5].includes(newPosition)) newPosition--;
      } else {
        newPosition = dateTextLength + offset;
      }
    }

    setPosition(newPosition);
    changeCursorPosition(newPosition);
  };

  const changeCursorPosition = (newPosition = position) => {
    const inputElem = document.getElementById(inputId) as HTMLInputElement;

    inputElem.selectionStart = newPosition;
    inputElem.selectionEnd = newPosition;
  };

  return (
    <div className='mb-3 fs-5'>
      {title && (
        <label htmlFor={inputId} className='form-label'>
          {title}
        </label>
      )}
      <input
        id={inputId}
        type='text'
        value={prettyDate}
        onChange={(e) => onChange(e)}
        onKeyDown={(e) => onKeyDown(e)}
        onFocus={() => changePosition()}
        onClick={(e: any) => setPosition(e.target.selectionStart)}
        disabled={disabled}
        className={'form-control' +
          (value === null && dateText.length === 8 ? ' is-invalid' : '')}
      />
    </div>
  );
};

export default FormDateInput;
