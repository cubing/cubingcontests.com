'use client';

import { useEffect, useMemo, useState } from 'react';
import FormEventSelect from '../form/FormEventSelect';
import FormTextInput from '../form/FormTextInput';
import FormSelect from '../form/FormSelect';
import FormPersonInputs from '../form/FormPersonInputs';
import { ICompetitionEvent, IEvent, IPerson, IRecordPair, IRecordType, IResult, IRound } from '@sh/interfaces';
import { RoundFormat, RoundType } from '@sh/enums';
import { getBestAverageAndAttempts, getRoundCanHaveAverage } from '~/helpers/utilityFunctions';
import { roundTypes } from '~/helpers/roundTypes';
import { roundFormats } from '~/helpers/roundFormats';
import { roundFormatOptions } from '~/helpers/multipleChoiceOptions';
import Time from '../Time';
import { setNewRecordsForResult } from '~/shared_helpers/sharedFunctions';
import Loading from '../Loading';

/**
 * This component has two uses: for entering results on PostResultsScreen, in which case it requires
 * round, setRound, rounds and competitionEvents to be set, since it works with actual rounds.
 * setEvent, events, roundFormat and setRoundformat must be left undefined.
 *
 * The other use case is on the submit results page, in which case those props must be left undefined,
 * but setEvent, events, roundFormat and setRoundFormat must be set.
 */

const getDefaultTempResult = (): IResult =>
  ({
    best: -1,
    average: -1,
  } as IResult);

const ResultForm = ({
  event,
  setEvent,
  events,
  competitionEvents,
  persons,
  setPersons,
  attempts,
  setAttempts,
  round,
  setRound,
  rounds, // all rounds for the current competition event
  roundFormat,
  setRoundFormat,
  recordPairs,
  loadingRecordPairs = false,
  recordTypes,
  nextFocusTargetId,
  setErrorMessages,
  setSuccessMessage,
  resetTrigger,
}: {
  event: IEvent;
  setEvent?: (val: IEvent) => void;
  events?: IEvent[];
  competitionEvents?: ICompetitionEvent[];
  persons: IPerson[];
  setPersons: (val: IPerson[]) => void;
  attempts: string[];
  setAttempts: (val: string[]) => void;
  // If one of these three is set, all of them must be set!
  round?: IRound;
  setRound?: (val: IRound) => void;
  rounds?: IRound[];
  roundFormat?: RoundFormat;
  setRoundFormat?: (val: RoundFormat) => void;
  recordPairs: IRecordPair[];
  loadingRecordPairs?: boolean;
  recordTypes: IRecordType[];
  nextFocusTargetId?: string;
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage: (val: string) => void;
  resetTrigger: boolean;
}) => {
  // This is only needed for displaying the temporary best single and average, as well as any record badges
  const [tempResult, setTempResult] = useState<IResult>(getDefaultTempResult());
  const [personNames, setPersonNames] = useState(['']);

  if (!roundFormat) roundFormat = round.format;

  const roundCanHaveAverage = useMemo(() => getRoundCanHaveAverage(roundFormat, event), [roundFormat, event]);

  useEffect(() => reset(roundFormat), [resetTrigger, roundFormat, event]);

  useEffect(() => {
    // Set perons names if there are no null persons (needed for the edit result feature on PostResultsScreen)
    if (!persons.some((el) => el === null)) {
      setPersonNames(persons.map((el) => el.name));
      document.getElementById('attempt_1').focus();
    }
  }, [persons]);

  useEffect(() => {
    if (attempts.length > 0) updateTempBestAndAverage(attempts);
  }, [attempts, recordPairs]);

  const nonNullPersons = persons.filter((el) => el !== null);

  useEffect(() => {
    // Focus the first empty competitor input
    if (persons.some((el) => el !== null)) {
      document.getElementById(`Competitor_${persons.findIndex((el) => el === null) + 1}`)?.focus();
    }
  }, [nonNullPersons.length]);

  const changeEvent = (newEventId: string) => {
    if (round) {
      const newCompEvent = competitionEvents.find((el) => el.event.eventId === newEventId);
      setRound(newCompEvent.rounds[0]);
    } else {
      setEvent(events.find((el) => el.eventId === newEventId));
    }
  };

  const changeRound = (newRoundType: RoundType) => {
    const currCompEvent = competitionEvents.find((ce) => ce.event.eventId === event.eventId);
    setRound(currCompEvent.rounds.find((r) => r.roundTypeId === newRoundType));
  };

  const changeRoundFormat = (newRoundFormat: RoundFormat) => {
    reset(newRoundFormat);
  };

  // Returns true if there are errors
  const checkPersonSelectionErrors = (newSelectedPerson: IPerson): boolean => {
    if (round?.results.some((res: IResult) => res.personIds.includes(newSelectedPerson.personId))) {
      setErrorMessages(["That competitor's results have already been entered"]);
      return true;
    }

    return false;
  };

  const changeAttempt = (index: number, value: string) => {
    if (value.length > 7) return;

    if (['DNF', 'DNS'].includes(value) || !/[^0-9]/.test(value)) {
      const newAttempts = attempts.map((el, i) => (i !== index ? el : value));
      setAttempts(newAttempts);
      updateTempBestAndAverage(newAttempts);
    }
  };

  const focusNext = (index: number) => {
    // Focus next time input or the submit button if it's the last input
    if (index + 1 < attempts.length) {
      document.getElementById(`attempt_${index + 2}`)?.focus();
    } else {
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    }
  };

  const onAttemptKeyDown = (e: any, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusNext(index);
      updateTempBestAndAverage();
    } else if (e.key === 'Backspace') {
      if (['DNF', 'DNS'].includes(attempts[index])) {
        e.preventDefault();
        changeAttempt(index, '');
      }
    } else if (['f', 'F', 'd', 'D', '/'].includes(e.key)) {
      e.preventDefault();
      changeAttempt(index, 'DNF');
      focusNext(index);
    } else if (['s', 'S', '*'].includes(e.key)) {
      e.preventDefault();
      changeAttempt(index, 'DNS');
      focusNext(index);
    }
  };

  const reset = (newRoundFormat: RoundFormat) => {
    if (setRoundFormat) setRoundFormat(newRoundFormat);
    setErrorMessages([]);
    setPersons(Array(event.participants || 1).fill(null));
    setPersonNames(Array(event.participants || 1).fill(''));
    setAttempts(Array(roundFormats[newRoundFormat].attempts).fill(''));
    setTempResult(getDefaultTempResult());

    document.getElementById('Competitor_1')?.focus();
  };

  const updateTempBestAndAverage = (newAttempts = attempts) => {
    const { best, average } = getBestAverageAndAttempts(newAttempts, roundFormat, event);
    const newTempResult = setNewRecordsForResult({ best, average } as IResult, recordPairs);
    setTempResult(newTempResult);
  };

  return (
    <>
      <FormEventSelect
        events={round ? competitionEvents.map((el) => el.event) : events}
        eventId={event.eventId}
        setEventId={(val) => changeEvent(val)}
      />
      <div className="mb-3 fs-5">
        {round ? (
          <FormSelect
            title="Round"
            options={rounds.map((el) => ({ label: roundTypes[el.roundTypeId].label, value: el.roundTypeId }))}
            selected={round.roundTypeId}
            setSelected={(val) => changeRound(val)}
          />
        ) : (
          <FormSelect
            title="Format"
            options={roundFormatOptions}
            selected={roundFormat}
            setSelected={changeRoundFormat}
          />
        )}
      </div>
      <div className="mb-4">
        <FormPersonInputs
          title="Competitor"
          personNames={personNames}
          setPersonNames={setPersonNames}
          persons={persons}
          setPersons={setPersons}
          checkCustomErrors={checkPersonSelectionErrors}
          nextFocusTargetId="attempt_1"
          setErrorMessages={setErrorMessages}
          setSuccessMessage={setSuccessMessage}
        />
      </div>
      {attempts.map((attempt, i) => (
        <FormTextInput
          key={i}
          id={`attempt_${i + 1}`}
          value={attempt}
          placeholder={`Attempt ${i + 1}`}
          setValue={(val: string) => changeAttempt(i, val)}
          onKeyDown={(e: any) => onAttemptKeyDown(e, i)}
        />
      ))}
      <div className="mb-3">
        {loadingRecordPairs ? (
          <Loading small dontCenter />
        ) : (
          <>
            Best:&nbsp;
            <Time result={tempResult} event={event} recordTypes={recordTypes} />
            {roundCanHaveAverage && (
              <>
                &#8194;|&#8194;Average:&nbsp;
                <Time result={tempResult} event={event} recordTypes={recordTypes} average />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ResultForm;
