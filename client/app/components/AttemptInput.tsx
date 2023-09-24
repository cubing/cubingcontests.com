'use client';

import { useEffect, useMemo, useState } from 'react';
import FormTextInput from './form/FormTextInput';
import { getAttempt, getFormattedTime } from '~/helpers/utilityFunctions';
import { EventFormat, EventGroup } from '@sh/enums';
import { IAttempt, IEvent } from '@sh/interfaces';
import { getAlwaysShowDecimals } from '@sh/sharedFunctions';
import C from '@sh/constants';

const getIsDNSKey = (e: any): boolean => ['s', 'S', '*'].includes(e.key);

const getFormattedText = (text: string, forMemo = false): string => {
  let output = '';
  const decimals = forMemo ? 0 : 2;

  if (forMemo && text === undefined) return '0:00';
  else if (!forMemo && text === '') return '0.00';
  else if (['DNF', 'DNS', 'Unknown'].includes(text)) return text;
  // Memo time formatting always requires minutes, even if they're 0
  else if (text.length < 5 && !forMemo) output = (parseInt(text) / 100).toFixed(decimals);
  else {
    if (text.length >= 7) output += text.slice(0, text.length - 6) + ':'; // hours
    if (text.length >= 5) {
      output += text.slice(Math.max(text.length - 6, 0), -4) + ':'; // minutes
      const seconds = parseInt(text.slice(text.length - 4)) / 100;
      output += (seconds < 10 ? '0' : '') + seconds.toFixed(decimals); // seconds
    } else {
      const seconds = Number(text.slice(0, -2));
      output += '0:' + (seconds < 10 ? '0' : '') + seconds;
    }
  }

  return output;
};

const AttemptInput = ({
  number,
  attempt,
  setAttempt,
  event,
  focusNext,
  memoInputForBld = false,
  resetTrigger,
  allowUnknownTime = false,
}: {
  number: number;
  attempt: IAttempt;
  setAttempt: (val: IAttempt) => void;
  event: IEvent;
  focusNext: () => void;
  memoInputForBld?: boolean;
  resetTrigger: boolean;
  allowUnknownTime?: boolean;
}) => {
  const [solved, setSolved] = useState('');
  const [attempted, setAttempted] = useState('');
  const [attemptText, setAttemptText] = useState('');
  // undefined is the empty value. If left like that, the memo won't be saved in the DB.
  const [memoText, setMemoText] = useState(undefined);

  const formattedAttemptText = useMemo(() => getFormattedText(attemptText), [attemptText]);
  const formattedMemoText = useMemo(() => getFormattedText(memoText, true), [memoText]);

  const isInvalidAttempt = attempt.result === null || attempt.memo === null;
  const includeMemo = memoInputForBld && event.groups.includes(EventGroup.HasMemo);

  useEffect(() => {
    if (attempt.result !== null && attempt.memo !== null) {
      if (![-1, -2, C.maxTime].includes(attempt.result)) {
        // Attempt time
        if (attempt.result === 0) {
          setAttemptText(``);
        } else if (event.format !== EventFormat.Multi) {
          setAttemptText(getFormattedTime(attempt.result, { event, noFormatting: true }));
        } else {
          const formattedTime = getFormattedTime(attempt.result, { event, noFormatting: true });
          const [newSolved, newAttempted, newAttText] = formattedTime.split(`;`);

          setSolved(newSolved);
          setAttempted(newAttempted);
          setAttemptText(newAttText === C.maxTime.toString() ? `Unknown time` : newAttText);
        }

        // Memo time
        if (attempt.memo > 0) {
          setMemoText(getFormattedTime(attempt.memo, { noFormatting: true }));
        }
      }
    }
  }, [attempt]);

  useEffect(() => {
    setSolved(``);
    setAttempted(``);
    setAttemptText(``);
    setMemoText(undefined);
  }, [resetTrigger]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSetDNS = (e: any) => {
    e.preventDefault();

    setAttempt({ result: -2 }); // set DNS
    setSolved(``);
    setAttempted(``);
    setAttemptText(`DNS`);
    setMemoText(undefined);
    focusNext();
  };

  const getIsValidCubesValue = (val: string) =>
    (val.length <= 2 || (val.length <= 3 && event.eventId === `333mbo`)) && !/[^0-9]/.test(val);
  const getIsEnteredCubesValue = (val: string) => val.length === 3 || (event.eventId !== `333mbo` && val.length === 2);

  const changeSolved = (value: string) => {
    if (getIsValidCubesValue(value)) {
      setSolved(value);
      if (attemptText) setAttempt(getAttempt(attempt, event, attemptText, value, attempted, memoText));

      if (getIsEnteredCubesValue(value)) document.getElementById(`attempt_${number}_attempted`).focus();
    }
  };

  const onSolvedKeyDown = (e: any) => {
    if (e.key === `Enter`) document.getElementById(`attempt_${number}_attempted`).focus();
    else if (getIsDNSKey(e)) handleSetDNS(e);
  };

  const changeAttempted = (value: string) => {
    if (getIsValidCubesValue(value)) {
      setAttempted(value);
      if (attemptText) setAttempt(getAttempt(attempt, event, attemptText, solved, value, memoText));

      if (getIsEnteredCubesValue(value)) document.getElementById(`attempt_${number}`).focus();
    }
  };

  const onAttemptedKeyDown = (e: any) => {
    if (e.key === `Enter`) document.getElementById(`attempt_${number}`).focus();
  };

  const onTimeKeyDown = (e: any, forMemo = false) => {
    if (e.key === `Enter`) {
      e.preventDefault();

      if (includeMemo && !forMemo) document.getElementById(`attempt_${number}_memo`).focus();
      else focusNext();
    } else if (e.key === `Backspace`) {
      e.preventDefault();

      if (
        (event.format !== EventFormat.Multi && (attempt.result < 0 || attempt.result === C.maxTime)) ||
        // For Multi format we can only erase a DNS, otherwise we must be erasing the time
        (event.format === EventFormat.Multi && attempt.result === -2)
      ) {
        setAttempt({ ...attempt, result: 0 });
        if (event.format === EventFormat.Multi) document.getElementById(`attempt_${number}_solved`).focus();
      } else {
        if (!forMemo && attemptText !== ``) {
          const newAttText = attemptText.slice(0, -1);
          setAttemptText(newAttText);
          setAttempt(getAttempt(attempt, event, newAttText, solved, attempted, memoText));
        } else if (forMemo && memoText !== undefined) {
          let newMemoText = memoText.slice(0, -3) + '00';
          if (newMemoText === '00') newMemoText = undefined;
          console.log(newMemoText);
          setMemoText(newMemoText);
          setAttempt(getAttempt(attempt, event, attemptText, solved, attempted, newMemoText));
        }
      }
    }
    // else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    else if ([`f`, `F`, `d`, `D`, `/`].includes(e.key) && !forMemo) {
      e.preventDefault();

      if (event.format !== EventFormat.Multi) {
        setAttempt({ result: -1 }); // set DNF
        setAttemptText(`DNF`);
        setMemoText(undefined);
        focusNext();
      }
    } else if ([`u`, `U`].includes(e.key) && !forMemo) {
      e.preventDefault();

      if (allowUnknownTime) {
        if (event.format !== EventFormat.Multi) {
          setAttempt({ result: C.maxTime });
          setAttemptText(`Unknown`);
          setMemoText(undefined);
        } else {
          setAttempt(getAttempt(attempt, event, C.maxTime.toString(), solved, attempted));
        }

        focusNext();
      }
    } else if (getIsDNSKey(e) && !forMemo) {
      handleSetDNS(e);
    } else if (/^[0-9]$/.test(e.key)) {
      let text: string;
      if (forMemo) text = memoText || `00`;
      else text = isNaN(Number(attemptText)) ? `` : attemptText;

      if (e.key === '0' && ['', '00'].includes(text)) return; // don't allow entering 0 as the first digit

      const newText = !forMemo ? text + e.key : text.slice(0, -2) + e.key + '00';
      console.log(newText);

      if (newText.length <= 2 || (newText.length <= 8 && event.format !== EventFormat.Number)) {
        const newAttempt = getAttempt(
          attempt,
          event,
          forMemo ? attemptText : newText,
          solved,
          attempted,
          forMemo ? newText : memoText,
        );
        setAttempt(newAttempt);

        // If the updated attempt is valid, it will get updated in useEffect anyways
        if (newAttempt.result === null || newAttempt.memo === null) {
          if (forMemo) setMemoText(newText);
          else setAttemptText(newText);
        }
      }
    }
  };

  const onTimeFocusOut = (forMemo = false) => {
    // Get rid of the decimals if one of the times is >= 10 minutes and the event category is not
    // ExtremeBLD (with the exception of Multi format, which should still have its time rounded)
    if (attemptText.length >= 6 || (forMemo && memoText?.length >= 6)) {
      setAttempt(
        getAttempt(attempt, event, attemptText, solved, attempted, memoText, {
          roundTime: !getAlwaysShowDecimals(event),
          roundMemo: true,
        }),
      );
    }
  };

  return (
    <div className="row">
      {event.format === EventFormat.Multi && (
        <>
          <div className={includeMemo ? `col-2` : `col-3`}>
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
          <div className={includeMemo ? `col-2` : `col-3`}>
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
          placeholder={event.format === EventFormat.Multi ? `Time ${number}` : `Attempt ${number}`}
          value={event.format !== EventFormat.Number ? formattedAttemptText : attemptText}
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
            placeholder="Memo (seconds)"
            onKeyDown={(e: any) => onTimeKeyDown(e, true)}
            onBlur={() => onTimeFocusOut(true)}
            disabled={[`DNF`, `DNS`, `Unknown`].includes(formattedAttemptText)}
            invalid={isInvalidAttempt}
          />
        </div>
      )}
    </div>
  );
};

export default AttemptInput;
