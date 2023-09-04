'use client';

import { useEffect, useMemo, useState } from 'react';
import FormTextInput from './form/FormTextInput';
import { getAttempt, getFormattedTime } from '~/helpers/utilityFunctions';
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
  const [solved, setSolved] = useState('');
  const [attempted, setAttempted] = useState('');

  const formattedAttemptText = useMemo(() => {
    let output = '';

    if (attemptText.length === 0) return '0.00';
    else if (['DNF', 'DNS'].includes(attemptText)) return attemptText;
    else if (attemptText.length < 5) output = (parseInt(attemptText) / 100).toFixed(2);
    else {
      if (attemptText.length === 7) output = attemptText[0] + ':'; // hours
      output += attemptText.slice(Math.max(attemptText.length - 6, 0), -4) + ':'; // minutes
      const seconds = parseInt(attemptText.slice(attemptText.length - 4)) / 100;
      output += (seconds < 10 ? '0' : '') + seconds.toFixed(2); // seconds
    }

    return output;
  }, [attemptText]);

  const isInvalidAttempt = attempt === null;
  // && (eventFormat !== EventFormat.Multi || (!!attemptText && !!solved && !!attempted));

  useEffect(() => {
    if (attempt !== null) {
      setSolved('');
      setAttempted('');

      if (attempt === 0) {
        setAttemptText('');
      } else if (attempt === -1) {
        setAttemptText('DNF');
      } else if (attempt === -2) {
        setAttemptText('DNS');
      } else if (eventFormat !== EventFormat.Multi) {
        setAttemptText(getFormattedTime(attempt, eventFormat, true));
      } else {
        const [newSolved, newAttempted, newAttText] = getFormattedTime(attempt, EventFormat.Multi, true).split(';');

        setSolved(newSolved);
        setAttempted(newAttempted);
        setAttemptText(newAttText);
      }
    }
  }, [attempt]);

  const changeSolved = (value: string) => {
    if (value.length <= 2 && !/[^0-9]/.test(value)) {
      setSolved(value);
      setAttempt(getAttempt(eventFormat, attemptText, value, attempted, true));

      if (value.length === 2) document.getElementById(`attempt_${number}_attempted`).focus();
    }
  };

  const onSolvedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}_attempted`).focus();
  };

  const changeAttempted = (value: string) => {
    if (value.length <= 2 && !/[^0-9]/.test(value)) {
      setAttempted(value);
      setAttempt(getAttempt(eventFormat, attemptText, solved, value, true));

      if (value.length === 2) document.getElementById(`attempt_${number}`).focus();
    }
  };

  const onAttemptedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}`).focus();
  };

  const onAttemptKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusNext();
    } else if (e.key === 'Backspace') {
      e.preventDefault();

      if (attempt < 0) {
        setAttempt(null);
      } else if (attemptText !== '') {
        const newAttText = attemptText.slice(0, -1);
        setAttemptText(newAttText);

        if (newAttText === '') setAttempt(0);
        else setAttempt(getAttempt(eventFormat, newAttText, solved, attempted, true));
      }
    } else if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    } else if (['f', 'F', 'd', 'D', '/'].includes(e.key)) {
      e.preventDefault();

      if (eventFormat !== EventFormat.Multi) {
        setAttempt(-1); // set DNF
        focusNext();
      }
    } else if (['s', 'S', '*'].includes(e.key)) {
      e.preventDefault();

      if (eventFormat !== EventFormat.Multi) {
        setAttempt(-2); // set DNS
        focusNext();
      }
    } else if (/^[0-9]$/.test(e.key)) {
      if (e.key === '0' && attemptText === '') return; // don't allow entering 0 as the first digit
      const newAttText = attemptText + e.key;

      // Maximum length is 2 for event format Number and 7 for everything else.
      if (newAttText.length <= 2 || (newAttText.length <= 7 && eventFormat !== EventFormat.Number)) {
        const newAttempt = getAttempt(eventFormat, newAttText, solved, attempted, true);
        setAttempt(newAttempt);

        // If the updated attempt is valid (not null), it will get updated in useEffect anyways
        if (newAttempt === null) setAttemptText(newAttText);
      }
    }
  };

  const onAttemptFocusOut = () => {
    // Get rid of the decimals if the attempt is >= 10 minutes
    setAttempt(getAttempt(eventFormat, attemptText, solved, attempted, false));
  };

  return (
    <div className="row">
      {eventFormat === EventFormat.Multi && (
        <>
          <div className="col-3">
            <FormTextInput
              id={`attempt_${number}_solved`}
              value={solved}
              placeholder="Solved"
              setValue={(val: string) => changeSolved(val)}
              onKeyDown={(e: any) => onSolvedKeyDown(e)}
              disabled={attempt < 0}
              invalid={isInvalidAttempt}
            />
          </div>
          <div className="col-3">
            <FormTextInput
              id={`attempt_${number}_attempted`}
              value={attempted}
              placeholder="Total"
              setValue={(val: string) => changeAttempted(val)}
              onKeyDown={(e: any) => onAttemptedKeyDown(e)}
              disabled={attempt < 0}
              invalid={isInvalidAttempt}
            />
          </div>
        </>
      )}
      <div className={eventFormat !== EventFormat.Multi ? 'col' : 'col-6'}>
        <FormTextInput
          id={`attempt_${number}`}
          value={formattedAttemptText}
          placeholder={eventFormat === EventFormat.Multi ? `Time ${number}` : `Attempt ${number}`}
          onKeyDown={(e: any) => onAttemptKeyDown(e)}
          onBlur={onAttemptFocusOut}
          invalid={isInvalidAttempt}
        />
      </div>
    </div>
  );
};

export default TimeInput;
