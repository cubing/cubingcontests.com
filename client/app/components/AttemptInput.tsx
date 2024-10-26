"use client";

import { useEffect, useMemo, useState } from "react";
import FormTextInput from "./form/FormTextInput.tsx";
import FormNumberInput from "./form/FormNumberInput.tsx";
import { getAttempt } from "~/helpers/utilityFunctions.ts";
import { EventFormat, EventGroup } from "~/shared_helpers/enums.ts";
import { IEvent, type IFeAttempt, ITimeLimit, type NumberInputValue } from "~/shared_helpers/types.ts";
import { getAlwaysShowDecimals, getFormattedTime } from "~/shared_helpers/sharedFunctions.ts";
import C from "~/shared_helpers/constants.ts";

const DNFKeys = ["f", "F", "d", "D", "/"];
const DNSKeys = ["s", "S", "*"];
const unknownTimeKeys = ["u", "U"];

const getFormattedText = (
  text: string,
  { forMemo = false, isNumberFormat = false },
): string => {
  if (isNumberFormat) return text;

  let output = "";
  const decimals = forMemo ? 0 : 2;

  if (forMemo && text === undefined) return "0:00";
  else if (!forMemo && text === "") return "0.00";
  else if (["DNF", "DNS", "Unknown"].includes(text)) return text;
  // Memo time formatting always requires minutes, even if they're 0
  else if (text.length < 5 && !forMemo) {
    output = (parseInt(text) / 100).toFixed(decimals);
  } else {
    if (text.length >= 7) output += text.slice(0, text.length - 6) + ":"; // hours
    if (text.length >= 5) {
      output += text.slice(Math.max(text.length - 6, 0), -4) + ":"; // minutes
      const seconds = parseInt(text.slice(text.length - 4)) / 100;
      output += (seconds < 10 ? "0" : "") + seconds.toFixed(decimals); // seconds
    } else {
      const seconds = Number(text.slice(0, -2));
      output += "0:" + (seconds < 10 ? "0" : "") + seconds;
    }
  }

  return output;
};

const AttemptInput = ({
  attNumber,
  attempt,
  setAttempt,
  event,
  focusNext = () => {},
  timeLimit,
  memoInputForBld = false,
  // resetTrigger,
  allowUnknownTime = false,
  maxTime,
  disabled = false,
}: {
  attNumber: number; // number of the attempt (use 0 if the input is used for a time limit or cutoff)
  attempt: IFeAttempt;
  setAttempt: (val: IFeAttempt) => void;
  event: IEvent;
  focusNext?: () => void;
  timeLimit?: ITimeLimit;
  memoInputForBld?: boolean;
  // resetTrigger?: boolean;
  allowUnknownTime?: boolean;
  maxTime?: number; // maximum allowed time in centiseconds (can be used for time limit/cutoff inputs)
  disabled?: boolean;
}) => {
  const [solved, setSolved] = useState<NumberInputValue>(undefined);
  const [attempted, setAttempted] = useState<NumberInputValue>(undefined);
  const [attemptText, setAttemptText] = useState("");
  // undefined is the empty value. If left like that, the memo won't be saved in the DB.
  const [memoText, setMemoText] = useState(undefined);

  const formattedAttemptText = useMemo(
    () => getFormattedText(attemptText, { isNumberFormat: event.format === EventFormat.Number }),
    [attemptText, event],
  );
  const formattedMemoText = useMemo(
    () => getFormattedText(memoText, { forMemo: true, isNumberFormat: event.format === EventFormat.Number }),
    [memoText, event],
  );

  const isInvalidAttempt = attempt.result === null || attempt.memo === null || (!!maxTime && attempt.result > maxTime);
  const includeMemo = memoInputForBld && event.groups.includes(EventGroup.HasMemo);

  useEffect(() => {
    if (attempt.result !== null && attempt.memo !== null) {
      if (attempt.result === -1) {
        setAttemptText("DNF");
      } else if (attempt.result === -2) {
        setAttemptText("DNS");
      } else if (attempt.result === C.maxTime) {
        setAttemptText("Unknown");
      } else {
        // Attempt time
        if (attempt.result === 0) {
          setAttemptText("");
        } else if (event.format !== EventFormat.Multi) {
          setAttemptText(getFormattedTime(attempt.result, { event, noFormatting: true }));
        } else {
          const formattedTime = getFormattedTime(attempt.result, { event, noFormatting: true });
          const [newSolved, newAttempted, newAttText] = formattedTime.split(";");

          setSolved(Number(newSolved));
          setAttempted(Number(newAttempted));
          setAttemptText(newAttText === "24000000" ? "Unknown" : newAttText);
        }

        // Memo time
        if (attempt.memo && attempt.memo > 0) {
          setMemoText(getFormattedTime(attempt.memo, { noFormatting: true }));
        }
      }
    }
  }, [attempt]);

  // useEffect(() => {
  //   if (resetTrigger !== undefined) {
  //     setSolved(undefined);
  //     setAttempted(undefined);
  //     setAttemptText("");
  //     setMemoText(undefined);
  //   }
  // }, [resetTrigger]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSetDNS = (e: any) => {
    e.preventDefault();

    setAttempt({ result: -2 }); // set DNS
    setSolved(undefined);
    setAttempted(undefined);
    setAttemptText("DNS");
    setMemoText(undefined);
  };

  const changeSolved = (newSolved: NumberInputValue) => {
    setSolved(newSolved);
    if (attemptText) {
      setAttempt(getAttempt(attempt, event, attemptText, { solved: newSolved, attempted, memo: memoText }));
    }
  };

  const changeAttempted = (newAttempted: NumberInputValue) => {
    setAttempted(newAttempted);
    if (attemptText) {
      setAttempt(getAttempt(attempt, event, attemptText, { solved, attempted: newAttempted, memo: memoText }));
    }
  };

  const onCubesKeyDown = (e: any) => {
    if (DNSKeys.includes(e.key)) handleSetDNS(e);
  };

  const onTimeChange = (e: any, forMemo = false) => {
    const prevValue = forMemo ? formattedMemoText : formattedAttemptText;

    // Erase character
    if (e.target.value.length < prevValue.length) {
      if (
        // For non-multi results we can erase DNF, DNS, and Unknown time
        (event.format !== EventFormat.Multi && attempt.result !== null &&
          (attempt.result < 0 || attempt.result === C.maxTime)) ||
        // For Multi format we can only erase a DNS, otherwise we must be erasing the time
        (event.format === EventFormat.Multi && attempt.result === -2)
      ) {
        setAttempt({ ...attempt, result: 0 });
        if (event.format === EventFormat.Multi) document.getElementById(`attempt_${attNumber}_solved`)?.focus();
      } else {
        if (!forMemo && attemptText !== "") {
          const newAttText = attemptText.slice(0, -1);
          setAttemptText(newAttText);
          setAttempt(getAttempt(attempt, event, newAttText, { solved, attempted, memo: memoText }));
        } else if (forMemo && memoText !== undefined) {
          // This is different, because the memo input has no decimals, but memo time is still stored as centiseconds
          let newMemoText: string | undefined = memoText.slice(0, -3) + "00";
          if (newMemoText === "00") newMemoText = undefined;

          setMemoText(newMemoText);
          setAttempt(getAttempt(attempt, event, attemptText, { solved, attempted, memo: newMemoText }));
        }
      }
    } // Add character
    else if (e.target.value.length > prevValue.length) {
      const newCharacter = e.target.value[e.target.selectionStart - 1];

      if (!forMemo && DNFKeys.includes(newCharacter)) {
        if (event.format !== EventFormat.Multi) dnfTheAttempt();
      } else if (!forMemo && DNSKeys.includes(newCharacter)) {
        handleSetDNS(e);
      } else if (!forMemo && unknownTimeKeys.includes(newCharacter)) {
        // Multi-Blind doesn't allow unknown time, but Multi-Blind Old Style does
        if (allowUnknownTime && event.eventId !== "333mbf") {
          if (event.format !== EventFormat.Multi) {
            setAttempt({ result: C.maxTime });
            setAttemptText("Unknown");
            setMemoText(undefined);
          } else {
            // C.maxTime is 24 hours
            setAttempt(getAttempt(attempt, event, "24000000", { solved, attempted }));
          }

          focusNext();
        }
      } else if (/[0-9]/.test(newCharacter)) {
        let text: string;
        if (forMemo) text = memoText || "00";
        else text = isNaN(Number(attemptText)) ? "" : attemptText;

        if (newCharacter === "0" && ["", "00"].includes(text)) return; // don't allow entering 0 as the first digit

        const newText = !forMemo ? text + newCharacter : text.slice(0, -2) + newCharacter + "00";

        if (
          newText.length <= C.maxFmMoves.toString().length ||
          (newText.length <= 8 && event.format !== EventFormat.Number)
        ) {
          const newAttempt = getAttempt(attempt, event, forMemo ? attemptText : newText, {
            solved,
            attempted,
            memo: forMemo ? newText : memoText,
          });
          setAttempt(newAttempt);

          // If the updated attempt is valid, it will get updated in useEffect anyways
          if (newAttempt.result === null || newAttempt.memo === null) {
            if (forMemo) setMemoText(newText);
            else setAttemptText(newText);
          }
        }
      }
    }
  };

  const onTimeKeyDown = (e: any, forMemo = false) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // If it's not the memo input and there is a time limit that wasn't met, DNF the attempt
      if (!forMemo && timeLimit && attempt.result !== null && attempt.result >= timeLimit.centiseconds) {
        dnfTheAttempt();
        focusNext();
      } else if (!forMemo && includeMemo) {
        document.getElementById(`attempt_${attNumber}_memo`)?.focus();
      } else {
        focusNext();
      }
    } else if (C.navigationKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const onTimeFocusOut = (forMemo = false) => {
    // Get rid of the decimals if one of the times is >= 10 minutes and the event category is not
    // ExtremeBLD (with the exception of Multi format, which should still have its time rounded)
    if (attemptText.length >= 6 || (forMemo && memoText?.length >= 6)) {
      const newAttempt = getAttempt(attempt, event, attemptText, {
        roundTime: !getAlwaysShowDecimals(event),
        roundMemo: true,
        solved,
        attempted,
        memo: memoText,
      });

      if (newAttempt.result !== attempt.result || newAttempt.memo !== attempt.memo) setAttempt(newAttempt);
    }
  };

  const dnfTheAttempt = () => {
    setAttempt({ result: -1 }); // set DNF
    setAttemptText("DNF");
    setMemoText(undefined);
  };

  const resetCursorPosition = (e: any) => {
    e.target.selectionStart = e.target.value.length;
    e.target.selectionEnd = e.target.value.length;
  };

  const cubesInputClasses = "px-0" + (includeMemo ? " col-2" : " col-3");

  let timeInputTooltip = "";

  if (attNumber === 1) {
    const extraTip = allowUnknownTime ? "\nUse U for Unknown time." : "";

    if (event.format !== EventFormat.Multi) {
      timeInputTooltip = "Use D, F, or / for DNF.\nUse S or * for DNS." +
        extraTip;
    } else {
      timeInputTooltip =
        "Enter the result even for DNF attempts (they're treated as DNF, but the result is still shown).\nUse S or * for DNS." +
        extraTip;
    }
  }

  return (
    <div className={`${attNumber !== 0 ? "row px-3" : ""} gap-2 gap-md-3`}>
      {event.format === EventFormat.Multi && (
        <>
          <div className={cubesInputClasses}>
            <FormNumberInput
              id={`attempt_${attNumber}_solved`}
              title={attNumber === 1 ? "Solved" : ""}
              value={solved}
              setValue={changeSolved}
              onKeyDown={(e: any) => onCubesKeyDown(e)}
              nextFocusTargetId={`attempt_${attNumber}_attempted`}
              disabled={attempt.result === -2}
              integer
              min={0}
              max={event.eventId === "333mbo" ? 999 : 99}
              invalid={isInvalidAttempt}
            />
          </div>
          <div className={cubesInputClasses}>
            <FormNumberInput
              id={`attempt_${attNumber}_attempted`}
              title={attNumber === 1 ? "Total" : ""}
              value={attempted}
              setValue={changeAttempted}
              onKeyDown={(e: any) => onCubesKeyDown(e)}
              nextFocusTargetId={`attempt_${attNumber}`}
              disabled={attempt.result === -2}
              integer
              min={2}
              max={event.eventId === "333mbo" ? 999 : 99}
              invalid={isInvalidAttempt}
            />
          </div>
        </>
      )}
      <div className="col px-0">
        <FormTextInput
          id={`attempt_${attNumber}`}
          title={attNumber === 1 ? (event.format !== EventFormat.Number ? "Time" : "Moves") : ""}
          tooltip={timeInputTooltip}
          value={formattedAttemptText}
          onChange={(e) => onTimeChange(e)}
          onKeyDown={(e) => onTimeKeyDown(e)}
          onClick={resetCursorPosition}
          onFocus={resetCursorPosition}
          onBlur={() => onTimeFocusOut()}
          invalid={isInvalidAttempt}
          noMargin={attNumber === 0}
          disabled={disabled}
        />
      </div>
      {includeMemo && (
        <div className="col px-0">
          <FormTextInput
            id={`attempt_${attNumber}_memo`}
            title={attNumber === 1 ? "Memo" : ""}
            tooltip="Memorization time without the decimals. If unknown, leave as 0."
            value={formattedMemoText}
            onChange={(e) => onTimeChange(e, true)}
            onKeyDown={(e: any) => onTimeKeyDown(e, true)}
            onClick={resetCursorPosition}
            onFocus={resetCursorPosition}
            onBlur={() => onTimeFocusOut(true)}
            disabled={["DNF", "DNS", "Unknown"].includes(formattedAttemptText)}
            invalid={isInvalidAttempt}
          />
        </div>
      )}
    </div>
  );
};

export default AttemptInput;
