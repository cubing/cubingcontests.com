'use client';

import { useEffect, useState } from 'react';
import FormTextInput from './form/FormTextInput';
import { formatTime, getResult } from '~/helpers/utilityFunctions';
import { EventFormat } from '~/shared_helpers/enums';

const TimeInput = ({
  number,
  attempt,
  setAttempt,
  eventFormat,
  focusNext,
}: {
  number: number;
  attempt: number;
  setAttempt: (val: number) => void;
  eventFormat: EventFormat;
  focusNext: () => void;
}) => {
  const [attemptText, setAttemptText] = useState('');

  useEffect(() => {
    if (attempt !== null) {
      if (attempt === 0) setAttemptText('');
      else if (attempt === -1) setAttemptText('DNF');
      else if (attempt === -2) setAttemptText('DNS');
      else setAttemptText(formatTime(attempt, eventFormat, { noFormatting: true }));
    }
  }, [attempt]);

  const changeAttemptText = (value: string) => {
    // If the value is not longer than 7 characters and only contains numeric characters
    if (value.length <= 7 && !/[^0-9]/.test(value)) {
      setAttemptText(value);
      setAttempt(getResult(value, eventFormat));
    }
  };

  const onAttemptKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      focusNext();
    } else if (e.key === 'Backspace') {
      if (attempt < 0) {
        e.preventDefault();
        setAttempt(null);
      }
    } else if (['f', 'F', 'd', 'D', '/'].includes(e.key)) {
      e.preventDefault();
      setAttempt(-1);
      focusNext();
    } else if (['s', 'S', '*'].includes(e.key)) {
      e.preventDefault();
      setAttempt(-2);
      focusNext();
    }
  };

  return (
    <FormTextInput
      id={`attempt_${number}`}
      value={attemptText}
      placeholder={`Attempt ${number}`}
      setValue={(val: string) => changeAttemptText(val)}
      onKeyDown={(e: any) => onAttemptKeyDown(e)}
      invalid={attempt === null}
    />
  );
};

export default TimeInput;
