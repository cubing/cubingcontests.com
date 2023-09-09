'use client';

import { useEffect, useMemo, useState } from 'react';
import FormTextInput from './form/FormTextInput';
import { getAttempt, getFormattedTime } from '~/helpers/utilityFunctions';
import { EventFormat, EventGroup } from '@sh/enums';
import { IAttempt, IEvent } from '@sh/interfaces';

const getIsDNSKey = (e: any): boolean => ['s', 'S', '*'].includes(e.key);

const getFormattedText = (text: string): string => {
  let output = '';

  if (text === undefined) return ''; // for memo
  else if (text === '') return '0.00'; // for attempt result
  else if (['DNF', 'DNS'].includes(text)) return text;
  else if (text.length < 5) output = (parseInt(text) / 100).toFixed(2);
  else {
    if (text.length === 7) output = text[0] + ':'; // hours
    output += text.slice(Math.max(text.length - 6, 0), -4) + ':'; // minutes
    const seconds = parseInt(text.slice(text.length - 4)) / 100;
    output += (seconds < 10 ? '0' : '') + seconds.toFixed(2); // seconds
  }

  return output;
};

const TimeInput = ({
  number,
  attempt,
  setAttempt,
  event,
  focusNext,
  memoInputForBld = false,
}: {
  number: number;
  attempt: IAttempt;
  setAttempt: (val: IAttempt) => void;
  event: IEvent;
  focusNext: () => void;
  memoInputForBld?: boolean;
}) => {
  const includeMemo = memoInputForBld && event.groups.includes(EventGroup.HasMemo);

  const [attemptText, setAttemptText] = useState('');
  const [memoText, setMemoText] = useState<string>(undefined);
  const [solved, setSolved] = useState('');
  const [attempted, setAttempted] = useState('');

  const formattedAttemptText = useMemo(() => getFormattedText(attemptText), [attemptText]);
  const formattedMemoText = useMemo(() => getFormattedText(memoText), [memoText]);

  const isInvalidAttempt = attempt.result === null || attempt.memo === null;

  useEffect(() => {
    if (attempt.result !== null) {
      setSolved('');
      setAttempted('');
      setMemoText(undefined);

      if (attempt.result === -1) {
        setAttemptText('DNF');
      } else if (attempt.result === -2) {
        setAttemptText('DNS');
      } else {
        // Attempt time
        if (attempt.result === 0) {
          setAttemptText('');
        } else if (event.format !== EventFormat.Multi) {
          setAttemptText(getFormattedTime(attempt.result, event.format, true));
        } else {
          const formattedTime = getFormattedTime(attempt.result, EventFormat.Multi, true);
          const [newSolved, newAttempted, newAttText] = formattedTime.split(';');

          setSolved(newSolved);
          setAttempted(newAttempted);
          setAttemptText(newAttText);
        }

        // Memo time
        if (attempt.memo > 0) setMemoText(getFormattedTime(attempt.memo, EventFormat.Time, true));
      }
    }
  }, [attempt]);

  const changeSolved = (value: string) => {
    if (((event.eventId !== '333mbo' && value.length <= 2) || value.length <= 3) && !/[^0-9]/.test(value)) {
      setSolved(value);
      if (attemptText) setAttempt(getAttempt(attempt, event.format, attemptText, value, attempted, memoText, true));

      if ((event.eventId !== '333mbo' && value.length >= 2) || value.length >= 3) {
        document.getElementById(`attempt_${number}_attempted`).focus();
      }
    }
  };

  const handleSetDNS = (e: any) => {
    e.preventDefault();

    setAttempt({ result: -2 }); // set DNS
    focusNext();
  };

  const onSolvedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}_attempted`).focus();
    else if (getIsDNSKey(e)) handleSetDNS(e);
  };

  const changeAttempted = (value: string) => {
    if (((event.eventId !== '333mbo' && value.length <= 2) || value.length <= 3) && !/[^0-9]/.test(value)) {
      setAttempted(value);
      if (attemptText) setAttempt(getAttempt(attempt, event.format, attemptText, solved, value, memoText, true));

      if ((event.eventId !== '333mbo' && value.length >= 2) || value.length >= 3) {
        document.getElementById(`attempt_${number}`).focus();
      }
    }
  };

  const onAttemptedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}`).focus();
  };

  const onTimeKeyDown = (e: any, forMemoTime = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (includeMemo && !forMemoTime) document.getElementById(`attempt_${number}_memo`).focus();
      else focusNext();
    } else if (e.key === 'Backspace') {
      e.preventDefault();

      if (
        (event.format !== EventFormat.Multi && attempt.result < 0) ||
        // For Multi format we can only erase a DNS, otherwise we must be erasing the time
        (event.format === EventFormat.Multi && attempt.result === -2)
      ) {
        setAttempt({ ...attempt, result: 0 });
        if (event.format === EventFormat.Multi) document.getElementById(`attempt_${number}_solved`).focus();
      } else {
        if (!forMemoTime && attemptText !== '') {
          const newAttText = attemptText.slice(0, -1);
          setAttemptText(newAttText);
          setAttempt(getAttempt(attempt, event.format, newAttText, solved, attempted, memoText, true));
        } else if (forMemoTime && memoText !== undefined) {
          const newMemoText = memoText.slice(0, -1) || undefined;
          setMemoText(newMemoText);
          setAttempt(getAttempt(attempt, event.format, attemptText, solved, attempted, newMemoText, true));
        }
      }
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    } else if (['f', 'F', 'd', 'D', '/'].includes(e.key) && !forMemoTime) {
      e.preventDefault();

      if (event.format !== EventFormat.Multi) {
        setAttempt({ ...attempt, result: -1 }); // set DNF
        focusNext();
      }
    } else if (getIsDNSKey(e) && !forMemoTime) {
      handleSetDNS(e);
    } else if (/^[0-9]$/.test(e.key)) {
      if (!forMemoTime) {
        if (e.key === '0' && attemptText === '') return; // don't allow entering 0 as the first digit
        const newAttText = attemptText + e.key;

        // Maximum length is 2 for event format Number and 7 for everything else.
        if (newAttText.length <= 2 || (newAttText.length <= 7 && event.format !== EventFormat.Number)) {
          const newAttempt = getAttempt(attempt, event.format, newAttText, solved, attempted, memoText, true);
          setAttempt(newAttempt);

          // If the updated attempt is valid (not null), it will get updated in useEffect anyways
          if (newAttempt.result === null) setAttemptText(newAttText);
        }
      } else {
        if (e.key === '0' && memoText === undefined) return; // don't allow entering 0 as the first digit
        const newMemoText = (memoText || '') + e.key;

        if (newMemoText.length <= 7) {
          const newAttempt = getAttempt(attempt, event.format, attemptText, solved, attempted, newMemoText, true);
          setAttempt(newAttempt);

          // If the updated memo is valid (not null), it will get updated in useEffect anyways
          if (newAttempt.memo === null) setMemoText(newMemoText);
        }
      }
    }
  };

  const onTimeFocusOut = (forMemoTime = false) => {
    // Get rid of the decimals if one of the times is >= 10 minutes
    if (attemptText.length >= 6 || (forMemoTime && memoText.length >= 6)) {
      setAttempt(getAttempt(attempt, event.format, attemptText, solved, attempted, memoText, false));
    }
  };

  return (
    <div className="row">
      {event.format === EventFormat.Multi && (
        <>
          <div className={includeMemo ? 'col-2' : 'col-3'}>
            <FormTextInput
              id={`attempt_${number}_solved`}
              value={solved}
              placeholder="Solved"
              setValue={(val: string) => changeSolved(val)}
              onKeyDown={(e: any) => onSolvedKeyDown(e)}
              disabled={attempt.result === -2}
              invalid={isInvalidAttempt}
            />
          </div>
          <div className={includeMemo ? 'col-2' : 'col-3'}>
            <FormTextInput
              id={`attempt_${number}_attempted`}
              value={attempted}
              placeholder="Total"
              setValue={(val: string) => changeAttempted(val)}
              onKeyDown={(e: any) => onAttemptedKeyDown(e)}
              disabled={attempt.result === -2}
              invalid={isInvalidAttempt}
            />
          </div>
        </>
      )}
      <div className="col">
        <FormTextInput
          id={`attempt_${number}`}
          value={formattedAttemptText}
          placeholder={event.format === EventFormat.Multi ? `Time ${number}` : `Attempt ${number}`}
          onKeyDown={(e: any) => onTimeKeyDown(e)}
          onBlur={onTimeFocusOut}
          invalid={isInvalidAttempt}
        />
      </div>
      {includeMemo && (
        <div className="col">
          <FormTextInput
            id={`attempt_${number}_memo`}
            value={formattedMemoText}
            placeholder="Memo"
            onKeyDown={(e: any) => onTimeKeyDown(e, true)}
            onBlur={() => onTimeFocusOut(true)}
            disabled={[-1, -2].includes(attempt.result)}
            invalid={isInvalidAttempt}
          />
        </div>
      )}
    </div>
  );
};

export default TimeInput;
