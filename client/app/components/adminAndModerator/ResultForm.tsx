'use client';

import { useEffect, useState } from 'react';
import FormEventSelect from '../form/FormEventSelect';
import FormTextInput from '../form/FormTextInput';
import FormSelect from '../form/FormSelect';
import FormPersonInputs from '../form/FormPersonInputs';
import { ICompetitionEvent, IEvent, IPerson, IResult, IRound } from '@sh/interfaces';
import { EventGroup, RoundFormat, RoundType } from '@sh/enums';
import { formatTime, getBestAverageAndAttempts, getRoundCanHaveAverage } from '~/helpers/utilityFunctions';
import { roundTypes } from '~/helpers/roundTypes';
import { roundFormats } from '~/helpers/roundFormats';
import { roundFormatOptions } from '~/helpers/multipleChoiceOptions';

/**
 * This component has two uses: for entering results on PostResultsScreen, in which case it requires
 * round, setRound, rounds and competitionEvents to be set, since it works with actual rounds.
 * setEvent, events, roundFormat and setRoundformat must be left undefined.
 *
 * The other use case is on the submit results page, in which case those props must be left undefined,
 * but setEvent, events, roundFormat and setRoundFormat must be set.
 */

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
  nextFocusTargetId,
  setErrorMessages,
  setSuccessMessage,
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
  nextFocusTargetId?: string;
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage: (val: string) => void;
}) => {
  const [tempBest, setTempBest] = useState('');
  const [tempAverage, setTempAverage] = useState('');
  const [personNames, setPersonNames] = useState(['']);

  useEffect(() => {
    reset(round ? round.format : event.defaultRoundFormat);
    document.getElementById('Competitor_1')?.focus();
  }, [round, event]);

  useEffect(() => {
    setPersonNames(persons.map((el) => (el !== null ? el.name : '')));

    if (attempts.length > 0) updateTempBestAndAverage(attempts);
  }, [persons]);

  useEffect(() => {
    // Focus the first empty competitor input
    if (persons.some((el) => el !== null)) {
      document.getElementById(`Competitor_${persons.findIndex((el) => el === null) + 1}`)?.focus();
    }
  }, [persons.filter((el) => el !== null).length]);

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
    if (!/[^0-9-]$/.test(value)) {
      const newAttempts = attempts.map((el, i) => (i !== index ? el : value));
      setAttempts(newAttempts);
      updateTempBestAndAverage(newAttempts);
    }
  };

  const enterAttempt = (e: any, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Focus next time input or the submit button if it's the last input
      if (index + 1 < attempts.length) {
        document.getElementById(`attempt_${index + 2}`)?.focus();
      } else {
        if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
      }

      updateTempBestAndAverage();
    }
  };

  const reset = (roundFormat: RoundFormat) => {
    if (setRoundFormat) setRoundFormat(roundFormat);
    setSuccessMessage('');
    setErrorMessages([]);
    setPersons(Array(event.participants || 1).fill(null));
    setAttempts(Array(roundFormats[roundFormat].attempts).fill(''));
    setTempBest('');
    setTempAverage('');
  };

  const updateTempBestAndAverage = (newAttempts = attempts) => {
    const format = round ? round.format : roundFormat;
    const { best, average } = getBestAverageAndAttempts(newAttempts, format, event);

    setTempBest(formatTime(best, event));
    if (getRoundCanHaveAverage(format, event)) setTempAverage(formatTime(average, event, { isAverage: true }));
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
          onKeyDown={(e: any) => enterAttempt(e, i)}
        />
      ))}
      <p>
        Best: {tempBest}
        {tempAverage ? ` | Average: ${tempAverage}` : ''}
      </p>
    </>
  );
};

export default ResultForm;
