'use client';

import { useEffect, useMemo, useState } from 'react';
import FormTextInput from './form/FormTextInput';
import FormNumberInput from './form/FormNumberInput';
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
  const [solved, setSolved] = useState<number>(undefined);
  const [attempted, setAttempted] = useState<number>(undefined);
  const [attemptText, setAttemptText] = useState('');
  // undefined is the empty value. If left like that, the memo won't be saved in the DB.
  const [memoText, setMemoText] = useState(undefined);

  const formattedAttemptText = useMemo(() => getFormattedText(attemptText), [attemptText]);
  const formattedMemoText = useMemo(() => getFormattedText(memoText, true), [memoText]);

  const isInvalidAttempt = attempt.result === null || attempt.memo === null;
  const includeMemo = memoInputForBld && event.groups.includes(EventGroup.HasMemo);

  useEffect(() => {
    if (attempt.result !== null && attempt.memo !== null) {
      if (attempt.result === -1) {
        setAttemptText('DNF');
      } else if (attempt.result === -2) {
        setAttemptText('DNS');
      } else if (attempt.result === C.maxTime) {
        setAttemptText('Unknown');
      } else {
        // Attempt time
        if (attempt.result === 0) {
          setAttemptText('');
        } else if (event.format !== EventFormat.Multi) {
          setAttemptText(getFormattedTime(attempt.result, { event, noFormatting: true }));
        } else {
          const formattedTime = getFormattedTime(attempt.result, { event, noFormatting: true });
          const [newSolved, newAttempted, newAttText] = formattedTime.split(';');

          setSolved(Number(newSolved));
          setAttempted(Number(newAttempted));
          setAttemptText(newAttText === C.maxTime.toString() ? 'Unknown time' : newAttText);
        }

        // Memo time
        if (attempt.memo > 0) {
          setMemoText(getFormattedTime(attempt.memo, { noFormatting: true }));
        }
      }
    }
  }, [attempt]);

  useEffect(() => {
    setSolved(undefined);
    setAttempted(undefined);
    setAttemptText('');
    setMemoText(undefined);
  }, [resetTrigger]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSetDNS = (e: any) => {
    e.preventDefault();

    setAttempt({ result: -2 }); // set DNS
    setSolved(undefined);
    setAttempted(undefined);
    setAttemptText('DNS');
    setMemoText(undefined);
    focusNext();
  };

  const getIsEnteredCubesValue = (val: number) => val >= 100 || (event.eventId !== '333mbo' && val >= 10);

  const changeSolved = (newSolved: number | null | undefined) => {
    setSolved(newSolved);
    if (attemptText) setAttempt(getAttempt(attempt, event, attemptText, newSolved, attempted, memoText));

    if (getIsEnteredCubesValue(newSolved)) document.getElementById(`attempt_${number}_attempted`).focus();
  };

  const onSolvedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}_attempted`).focus();
    else if (getIsDNSKey(e)) handleSetDNS(e);
  };

  const changeAttempted = (newAttempted: number | null | undefined) => {
    setAttempted(newAttempted);
    if (attemptText) setAttempt(getAttempt(attempt, event, attemptText, solved, newAttempted, memoText));

    if (getIsEnteredCubesValue(newAttempted)) document.getElementById(`attempt_${number}`).focus();
  };

  const onAttemptedKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById(`attempt_${number}`).focus();
  };

  const onTimeKeyDown = (e: any, forMemo = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (includeMemo && !forMemo) document.getElementById(`attempt_${number}_memo`).focus();
      else focusNext();
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
    // UNIDENTIFIED IS HERE TEMPORARILY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    else if (['Backspace', 'Delete', 'Unidentified'].includes(e.key)) {
      e.preventDefault();

      if (
        (event.format !== EventFormat.Multi && (attempt.result < 0 || attempt.result === C.maxTime)) ||
        // For Multi format we can only erase a DNS, otherwise we must be erasing the time
        (event.format === EventFormat.Multi && attempt.result === -2)
      ) {
        setAttempt({ ...attempt, result: 0 });
        if (event.format === EventFormat.Multi) document.getElementById(`attempt_${number}_solved`).focus();
      } else {
        if (!forMemo && attemptText !== '') {
          const newAttText = attemptText.slice(0, -1);
          setAttemptText(newAttText);
          setAttempt(getAttempt(attempt, event, newAttText, solved, attempted, memoText));
        } else if (forMemo && memoText !== undefined) {
          let newMemoText = memoText.slice(0, -3) + '00';
          if (newMemoText === '00') newMemoText = undefined;

          setMemoText(newMemoText);
          setAttempt(getAttempt(attempt, event, attemptText, solved, attempted, newMemoText));
        }
      }
    }
    // else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    else if (['f', 'F', 'd', 'D', '/'].includes(e.key) && !forMemo) {
      e.preventDefault();

      if (event.format !== EventFormat.Multi) {
        setAttempt({ result: -1 }); // set DNF
        setAttemptText('DNF');
        setMemoText(undefined);
        focusNext();
      }
    } else if (['u', 'U'].includes(e.key) && !forMemo) {
      e.preventDefault();

      if (allowUnknownTime) {
        if (event.format !== EventFormat.Multi) {
          setAttempt({ result: C.maxTime });
          setAttemptText('Unknown');
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
      if (forMemo) text = memoText || '00';
      else text = isNaN(Number(attemptText)) ? '' : attemptText;

      if (e.key === '0' && ['', '00'].includes(text)) return; // don't allow entering 0 as the first digit

      const newText = !forMemo ? text + e.key : text.slice(0, -2) + e.key + '00';

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

  const cubesInputClasses = 'px-0' + (includeMemo ? ' col-2' : ' col-3');

  return (
    <div className="row px-3 gap-2 gap-md-3">
      {event.format === EventFormat.Multi && (
        <>
          <div className={cubesInputClasses}>
            <FormNumberInput
              id={`attempt_${number}_solved`}
              title={number === 1 ? 'Solved' : ''}
              value={solved}
              placeholder="10"
              onChange={changeSolved}
              onKeyDown={(e: any) => onSolvedKeyDown(e)}
              disabled={attempt.result === -2}
              integer
              min={0}
              max={event.eventId === '333mbo' ? 999 : 99}
              invalid={isInvalidAttempt}
            />
          </div>
          <div className={cubesInputClasses}>
            <FormNumberInput
              id={`attempt_${number}_attempted`}
              title={number === 1 ? 'Total' : ''}
              value={attempted}
              placeholder="10"
              onChange={changeAttempted}
              onKeyDown={(e: any) => onAttemptedKeyDown(e)}
              disabled={attempt.result === -2}
              integer
              min={2}
              max={event.eventId === '333mbo' ? 999 : 99}
              invalid={isInvalidAttempt}
            />
          </div>
        </>
      )}
      <div className="col px-0">
        <FormTextInput
          id={`attempt_${number}`}
          title={number === 1 ? 'Time' : ''}
          placeholder={event.format === EventFormat.Multi ? `Time ${number}` : `Attempt ${number}`}
          value={event.format !== EventFormat.Number ? formattedAttemptText : attemptText}
          onChange={() => {}}
          onKeyDown={(e: any) => onTimeKeyDown(e)}
          onBlur={onTimeFocusOut}
          invalid={isInvalidAttempt}
        />
      </div>
      {includeMemo && (
        <div className="col px-0">
          <FormTextInput
            id={`attempt_${number}_memo`}
            title={number === 1 ? 'Memo' : ''}
            placeholder="Memo (seconds)"
            value={formattedMemoText}
            onChange={() => {}}
            onKeyDown={(e: any) => onTimeKeyDown(e, true)}
            onBlur={() => onTimeFocusOut(true)}
            disabled={['DNF', 'DNS', 'Unknown'].includes(formattedAttemptText)}
            invalid={isInvalidAttempt}
          />
        </div>
      )}
    </div>
  );
};

export default AttemptInput;
