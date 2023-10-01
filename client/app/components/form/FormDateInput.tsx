'use client';

import { useEffect, useMemo, useState } from 'react';
import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import { format } from 'date-fns';

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
  nextFocusTargetId: string;
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

  const inputId = id || title + '_date';

  useEffect(() => {
    if (value) setDateText(format(value, 'ddMMyyyy'));
    else if (value === undefined) setDateText('');
  }, [value]);

  useEffect(() => {
    if (dateText) {
      if (dateText.length < 8) {
        setValue(null);
      } else {
        const parsed = parseISO(`${dateText.slice(4)}-${dateText.slice(2, 4)}-${dateText.slice(0, 2)}`);
        setValue(isValid(parsed) ? parsed : null);
      }
    } else if (value !== undefined) {
      setValue(undefined);
    }
  }, [dateText]);

  useEffect(() => {
    changeCursorPosition();
  }, [position]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById(nextFocusTargetId)?.focus();
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
    // UNIDENTIFIED IS HERE TEMPORARILY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    else if (['Backspace', 'Delete', 'Unidentified'].includes(e.key)) {
      e.preventDefault();

      if (position > 0) {
        if (position !== 3 && position !== 6) setPosition(position - 1);
        else setPosition(position - 2);

        setDateText(dateText.slice(0, -1));
      }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();

      if (dateText.length < 8) {
        setDateText(dateText + e.key);

        if (position === 1 || position === 4) setPosition(position + 2); // skip a dot
        else setPosition(position + 1);
      }
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
        onChange={(e) => e.preventDefault()}
        onKeyDown={(e) => onKeyDown(e)}
        onClick={changeCursorPosition}
        onFocus={changeCursorPosition}
        className={'form-control' + (value === null && dateText.length === 8 ? ' is-invalid' : '')}
      />
    </div>
  );
};

export default FormDateInput;
