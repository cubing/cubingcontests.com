'use client';

import { useEffect, useMemo, useState } from 'react';
import Loading from '../Loading';
import FormEventSelect from '../form/FormEventSelect';
import FormSelect from '../form/FormSelect';
import FormPersonInputs from '../form/FormPersonInputs';
import FormCheckbox from '../form/FormCheckbox';
import AttemptInput from '../AttemptInput';
import Time from '../Time';
import {
  IAttempt,
  ICompetitionEvent,
  IEvent,
  IPerson,
  IRecordPair,
  IRecordType,
  IResult,
  IRound,
} from '@sh/interfaces';
import { EventFormat, RoundFormat, RoundType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { getRoundCanHaveAverage } from '@sh/sharedFunctions';
import { getAllowedRoundFormats, getBestAndAverage } from '~/helpers/utilityFunctions';
import { roundTypes } from '~/helpers/roundTypes';
import { setResultRecords } from '~/shared_helpers/sharedFunctions';

/**
 * This component has two uses: for entering results on PostResultsScreen, in which case it requires
 * round, setRound, rounds and competitionEvents to be set, since it works with actual rounds.
 * setEvent, events, roundFormat and setRoundformat must be left undefined.
 *
 * The other use case is on the submit results page, in which case those props must be left undefined,
 * but setEvent, events, roundFormat and setRoundFormat must be set. In this case forSubmitResultsPage = true.
 */

const ResultForm = ({
  event,
  persons,
  setPersons,
  attempts,
  setAttempts,
  recordPairs,
  loadingRecordPairs = false,
  recordTypes,
  nextFocusTargetId,
  resetTrigger,
  setErrorMessages,
  setSuccessMessage,
  forSubmitResultsPage = false,
  round,
  setRound,
  rounds,
  competitionEvents,
  setEvent,
  events,
  roundFormat,
  setRoundFormat,
  showOptionToKeepCompetitors = false,
}: {
  event: IEvent;
  persons: IPerson[];
  setPersons: (val: IPerson[]) => void;
  attempts: IAttempt[];
  setAttempts: (val: IAttempt[]) => void;
  recordPairs: IRecordPair[];
  loadingRecordPairs?: boolean;
  recordTypes: IRecordType[];
  nextFocusTargetId?: string;
  resetTrigger: boolean;
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage: (val: string) => void;
  forSubmitResultsPage?: boolean;
  // These props are for PostResultsScreen
  round?: IRound;
  setRound?: (val: IRound) => void;
  rounds?: IRound[]; // all rounds for the current competition event
  competitionEvents?: ICompetitionEvent[];
  // These props are for the submit results page
  setEvent?: (val: IEvent) => void;
  events?: IEvent[];
  roundFormat?: RoundFormat;
  setRoundFormat?: (val: RoundFormat) => void;
  showOptionToKeepCompetitors?: boolean;
}) => {
  // This is only needed for displaying the temporary best single and average, as well as any record badges
  const [tempResult, setTempResult] = useState<IResult>({ best: -1, average: -1 } as IResult);
  const [personNames, setPersonNames] = useState(['']);
  // If this is null, that means the option is disabled
  const [keepCompetitors, setKeepCompetitors] = useState(showOptionToKeepCompetitors ? false : null);
  const [attemptsResetTrigger, setAttemptsResetTrigger] = useState(true);

  if (!forSubmitResultsPage) roundFormat = round.format;

  const roundCanHaveAverage = useMemo(() => getRoundCanHaveAverage(roundFormat, event), [roundFormat, event]);

  useEffect(() => reset(roundFormat), [resetTrigger, roundFormat, event]);

  useEffect(() => {
    // Set perons names if there are no null persons (needed for the edit result feature on PostResultsScreen)
    if (!persons.some((el) => el === null)) {
      setPersonNames(persons.map((el) => el.name));

      if (event.format === EventFormat.Multi) document.getElementById('attempt_1_solved').focus();
      else document.getElementById('attempt_1').focus();
    }
  }, [persons]);

  useEffect(() => {
    if (attempts.length > 0) {
      console.log('Attempts:', attempts);

      const { best, average } = getBestAndAverage(attempts, roundFormat, event);
      setTempResult(setResultRecords({ best, average } as IResult, recordPairs, true));
    }
  }, [attempts, recordPairs]);

  const nonNullPersons = persons.filter((el) => el !== null);

  useEffect(() => {
    // Focus the first empty competitor input
    if (persons.some((el) => el !== null)) {
      document.getElementById(`Competitor_${persons.findIndex((el) => el === null) + 1}`)?.focus();
    }
  }, [nonNullPersons.length]);

  const changeEvent = (newEventId: string) => {
    if (forSubmitResultsPage) {
      setEvent(events.find((el) => el.eventId === newEventId));
    } else {
      const newCompEvent = competitionEvents.find((el) => el.event.eventId === newEventId);
      setRound(newCompEvent.rounds[0]);
    }
  };

  const changeRound = (newRoundType: RoundType) => {
    const currCompEvent = competitionEvents.find((ce) => ce.event.eventId === event.eventId);
    setRound(currCompEvent.rounds.find((r) => r.roundTypeId === newRoundType));
  };

  // Returns true if there are errors
  const checkPersonSelectionErrors = (newSelectedPerson: IPerson): boolean => {
    if (round?.results.some((res: IResult) => res.personIds.includes(newSelectedPerson.personId))) {
      setErrorMessages(["That competitor's results have already been entered"]);
      return true;
    }

    return false;
  };

  const changeAttempt = (index: number, newAttempt: IAttempt) => {
    setAttempts(attempts.map((el, i) => (i !== index ? el : newAttempt)));
  };

  const focusNext = (index: number) => {
    // Focus next time input or the submit button if it's the last input
    if (index + 1 < attempts.length) {
      // If Multi format and the next attempt is not DNS, focus the solved input, therwise focus the time input
      if (event.format === EventFormat.Multi && attempts[index + 1].result !== -2) {
        document.getElementById(`attempt_${index + 2}_solved`).focus();
      } else {
        document.getElementById(`attempt_${index + 2}`).focus();
      }
    } else {
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    }
  };

  const reset = (newRoundFormat: RoundFormat) => {
    if (forSubmitResultsPage) setRoundFormat(newRoundFormat);
    setErrorMessages([]);
    setAttempts(new Array(roundFormats[newRoundFormat].attempts).fill({ result: 0 }));
    setAttemptsResetTrigger(!attemptsResetTrigger);
    setTempResult({ best: -1, average: -1 } as IResult);

    if (!keepCompetitors) {
      setPersons(new Array(event.participants || 1).fill(null));
      setPersonNames(new Array(event.participants || 1).fill(''));
      document.getElementById('Competitor_1')?.focus();
    } else {
      if (event.format === EventFormat.Multi) document.getElementById('attempt_1_solved').focus();
      else document.getElementById('attempt_1').focus();
    }
  };

  return (
    <>
      <FormEventSelect
        events={forSubmitResultsPage ? events : competitionEvents.map((el) => el.event)}
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
            options={getAllowedRoundFormats(event)}
            selected={roundFormat}
            setSelected={(val: RoundFormat) => reset(val)}
          />
        )}
      </div>
      <div className="mb-3">
        <FormPersonInputs
          title="Competitor"
          personNames={personNames}
          setPersonNames={setPersonNames}
          persons={persons}
          setPersons={setPersons}
          checkCustomErrors={checkPersonSelectionErrors}
          nextFocusTargetId={event.format !== EventFormat.Multi ? 'attempt_1' : 'attempt_1_solved'}
          setErrorMessages={setErrorMessages}
          setSuccessMessage={setSuccessMessage}
          redirectToOnAddPerson={window.location.pathname}
          noGrid={!forSubmitResultsPage}
        />
        {keepCompetitors !== null && (
          <FormCheckbox title="Don't clear competitors" selected={keepCompetitors} setSelected={setKeepCompetitors} />
        )}
      </div>
      {attempts.map((attempt, i) => (
        <AttemptInput
          key={i}
          number={i + 1}
          attempt={attempt}
          setAttempt={(val: IAttempt) => changeAttempt(i, val)}
          event={event}
          focusNext={() => focusNext(i)}
          memoInputForBld={forSubmitResultsPage}
          resetTrigger={attemptsResetTrigger}
        />
      ))}
      <div className="mb-3">
        {loadingRecordPairs ? (
          <Loading small dontCenter />
        ) : (
          <>
            <div>
              Best:&nbsp;
              <Time result={tempResult} event={event} recordTypes={recordTypes} />
            </div>
            {roundCanHaveAverage && (
              <div className="mt-2">
                {attempts.length === 5 ? 'Average:' : 'Mean:'}&nbsp;
                <Time result={tempResult} event={event} recordTypes={recordTypes} average />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ResultForm;
