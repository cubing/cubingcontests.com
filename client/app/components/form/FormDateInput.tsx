'use client';

import { useEffect, useMemo, useState } from 'react';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import { format } from 'date-fns';
import C from '@sh/constants';
import { genericOnKeyDown } from '~/helpers/utilityFunctions';
import { zonedTimeToUtc } from 'date-fns-tz';

const FormDateInput = ({
  id,
  title,
  value,
  setValue,
  nextFocusTargetId,
}: {
  id?: string;
  title: string;
  value: Date | null | undefined; // null means the date is invalid; undefined means it's empty
  setValue: (val: Date | null | undefined) => void;
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
        else if ([3, 4].includes(i) && dateText.length > i - 1) digit = dateText[i - 1];
        else if (i > 5 && dateText.length > i - 2) digit = dateText[i - 2];
        prettyDate += digit || '_';
      }
    }

    return prettyDate;
  }, [dateText]);

  const inputId = id || `${title}_date`;

  useEffect(() => {
    if (value) {
      setDateText(format(value, 'ddMMyyyy'));
      setPosition(10);
    } else if (value === undefined && dateText !== '') {
      setDateText('');
    }
  }, [value]);

  useEffect(() => {
    changeCursorPosition();
  }, [position]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const onChange = (e: any) => {
    // Backspace detection
    if (e.target.value.length < prettyDate.length) {
      if (position > 0) {
        if (![3, 6].includes(position)) setPosition(position - 1);
        else setPosition(position - 2);

        const newDateText = dateText.slice(0, -1);
        setDateText(newDateText);

        if (newDateText) setValue(null);
        else setValue(undefined);
      }
    }
    // New digit detection
    else if (e.target.value.length > prettyDate.length) {
      if (dateText.length < 8) {
        const newCharacter = e.target.value[e.target.selectionStart - 1];

        if (/[0-9]/.test(newCharacter)) {
          const newDateText = dateText + newCharacter;
          setDateText(newDateText);

          if (newDateText.length < 8) {
            setValue(null);
          } else {
            const parsed = parseISO(`${newDateText.slice(4)}-${newDateText.slice(2, 4)}-${newDateText.slice(0, 2)}`);
            // The conversion is necessary, because otherwise JS uses the user's local time zone
            setValue(isValid(parsed) ? zonedTimeToUtc(parsed, 'UTC') : null);
          }

          if (position === 1 || position === 4) setPosition(position + 2); // skip a dot
          else setPosition(position + 1);
        }
      }
    }
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      genericOnKeyDown(e, { nextFocusTargetId });
    } else if (C.navigationKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const changeCursorPosition = () => {
    (document.getElementById(inputId) as HTMLInputElement).selectionStart = position;
    (document.getElementById(inputId) as HTMLInputElement).selectionEnd = position;
  };

  return (
    <div className="mb-3 fs-5">
      {title && (
        <label htmlFor={inputId} className="form-label">
          {title}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={prettyDate}
        onChange={(e) => onChange(e)}
        onKeyDown={(e) => onKeyDown(e)}
        onClick={() => changeCursorPosition()}
        onFocus={() => changeCursorPosition()}
        className={'form-control' + (value === null && dateText.length === 8 ? ' is-invalid' : '')}
      />
    </div>
  );
};

export default FormDateInput;
