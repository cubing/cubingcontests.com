'use client';

import { useEffect, useState } from 'react';
import Loading from '@c/Loading';
import FormEventSelect from '@c/form/FormEventSelect';
import FormSelect from '@c/form/FormSelect';
import FormPersonInputs from '@c/form/FormPersonInputs';
import FormCheckbox from '@c/form/FormCheckbox';
import AttemptInput from '@c/AttemptInput';
import Time from '@c/Time';
import { IAttempt, IContestEvent, IEvent, IPerson, IRecordPair, IRecordType, IResult, IRound } from '@sh/interfaces';
import { EventFormat, RoundFormat, RoundType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { getBestAndAverage } from '~/helpers/utilityFunctions';
import { roundTypes } from '~/helpers/roundTypes';
import { setResultRecords } from '~/shared_helpers/sharedFunctions';
import { roundFormatOptions } from '~/helpers/multipleChoiceOptions';

/**
 * This component has 3 uses: for entering results on PostResultsScreen,
 * as well as for the submit results page and the edit result page.
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
  round,
  setRound,
  rounds,
  contestEvents,
  setEvent,
  events,
  roundFormat,
  setRoundFormat,
  disableMainSelects = false,
  showOptionToKeepCompetitors = false,
  isAdmin = false,
  forResultsSubmissionForm = false,
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
  resetTrigger: boolean; // if this is undefined, that means we're editing a result
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage: (val: string) => void;
  // These props are for PostResultsScreen
  round?: IRound;
  setRound?: (val: IRound) => void;
  rounds?: IRound[]; // all rounds for the current competition event
  contestEvents?: IContestEvent[];
  // These props are for the submit results page
  setEvent?: (val: IEvent) => void;
  events?: IEvent[];
  roundFormat?: RoundFormat;
  setRoundFormat?: (val: RoundFormat) => void;
  disableMainSelects?: boolean;
  showOptionToKeepCompetitors?: boolean;
  isAdmin?: boolean;
  forResultsSubmissionForm?: boolean;
}) => {
  // This is only needed for displaying the temporary best single and average, as well as any record badges
  const [tempResult, setTempResult] = useState<IResult>({ best: -1, average: -1 } as IResult);
  const [personNames, setPersonNames] = useState(['']);
  // If this is null, that means the option is disabled
  const [keepCompetitors, setKeepCompetitors] = useState(showOptionToKeepCompetitors ? false : null);
  const [attemptsResetTrigger, setAttemptsResetTrigger] = useState<boolean>();

  if (!forResultsSubmissionForm) roundFormat = round.format;

  const roundCanHaveAverage = roundFormats.find((rf) => rf.value === roundFormat).attempts >= 3;

  useEffect(() => {
    if (resetTrigger !== undefined) {
      reset();
      if (keepCompetitors) focusFirstAttempt();
      else document.getElementById('Competitor_1').focus();
    }
    // If resetTrigger is undefined, that means we're editing a result and
    else {
      // Set person names if there are no null persons (needed when editing results)
      if (!persons.some((el) => el === null)) setPersonNames(persons.map((el) => el.name));
      updateTempResult();
      focusFirstAttempt();
    }
  }, [resetTrigger]);

  // This sets record previews when the record pairs are updated on the submit results page or the edit result page
  useEffect(() => {
    if (forResultsSubmissionForm) updateTempResult();
  }, [recordPairs]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const focusFirstAttempt = () => {
    if (event.format === EventFormat.Multi) document.getElementById('attempt_1_solved')?.focus();
    else document.getElementById('attempt_1')?.focus();
  };

  const updateTempResult = () => {
    const { best, average } = getBestAndAverage(attempts, event);
    setTempResult(setResultRecords({ best, average, attempts } as IResult, event, recordPairs, true));
  };

  const changeEvent = (newEventId: string) => {
    let newEvent: IEvent;
    let newRoundFormat = roundFormat;

    if (forResultsSubmissionForm) {
      newEvent = events.find((el) => el.eventId === newEventId);
      setEvent(newEvent);
    } else {
      const newCompEvent = contestEvents.find((el) => el.event.eventId === newEventId);
      newEvent = newCompEvent.event;
      setRound(newCompEvent.rounds[0]);
      newRoundFormat = newCompEvent.rounds[0].format;
    }

    reset({ newEvent, newRoundFormat, resetCompetitors: newEvent.participants !== event.participants });
  };

  // Only used for PostResultsScreen
  const changeRound = (newRoundType: RoundType) => {
    const currCompEvent = contestEvents.find((ce) => ce.event.eventId === event.eventId);
    const newRound = currCompEvent.rounds.find((r) => r.roundTypeId === newRoundType);

    setRound(newRound);
    reset({ newRoundFormat: newRound.format, resetCompetitors: true });
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
    const newAttempts = attempts.map((el, i) => (i !== index ? el : newAttempt));
    setAttempts(newAttempts);

    // Update temporary best and average
    const { best, average } = getBestAndAverage(newAttempts, event);
    setTempResult(setResultRecords({ best, average, attempts: newAttempts } as IResult, event, recordPairs, true));
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

  const getAllowedRoundFormatOptions = (event: IEvent) => {
    if (event.defaultRoundFormat !== RoundFormat.Average) {
      return roundFormatOptions.filter((el) => el.value !== RoundFormat.BestOf3);
    }

    return roundFormatOptions;
  };

  const reset = (
    {
      newEvent = event,
      newRoundFormat = roundFormat,
      resetCompetitors = !keepCompetitors,
    }: { newEvent?: IEvent; newRoundFormat?: RoundFormat; resetCompetitors?: boolean } = {
      newEvent: event,
      newRoundFormat: roundFormat,
      resetCompetitors: !keepCompetitors,
    },
  ) => {
    if (forResultsSubmissionForm) {
      const allowedRoundFormats = getAllowedRoundFormatOptions(newEvent).map((el) => el.value);

      if (!allowedRoundFormats.includes(newRoundFormat)) setRoundFormat(RoundFormat.BestOf1);
      else setRoundFormat(newRoundFormat);
    }

    setErrorMessages([]);
    const newAttempts = new Array(roundFormats.find((rf) => rf.value === newRoundFormat).attempts).fill({ result: 0 });
    setAttempts(newAttempts);
    setAttemptsResetTrigger(!attemptsResetTrigger);
    setTempResult({ best: -1, average: -1, attempts: newAttempts } as IResult);

    if (resetCompetitors) {
      setPersons(new Array(newEvent.participants || 1).fill(null));
      setPersonNames(new Array(newEvent.participants || 1).fill(''));
    }
  };

  return (
    <>
      <FormEventSelect
        events={forResultsSubmissionForm ? events : contestEvents.map((el) => el.event)}
        eventId={event.eventId}
        setEventId={(val) => changeEvent(val)}
        disabled={disableMainSelects}
      />
      <div className="mb-3 fs-5">
        {forResultsSubmissionForm ? (
          <FormSelect
            title="Format"
            options={getAllowedRoundFormatOptions(event)}
            selected={roundFormat}
            setSelected={(val: RoundFormat) => reset({ newRoundFormat: val, resetCompetitors: false })}
            disabled={disableMainSelects}
          />
        ) : (
          <FormSelect
            title="Round"
            options={rounds.map((el) => ({ label: roundTypes[el.roundTypeId].label, value: el.roundTypeId }))}
            selected={round.roundTypeId}
            setSelected={changeRound}
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
          noGrid={!forResultsSubmissionForm}
        />
        {keepCompetitors !== null && (
          <FormCheckbox title="Don't clear competitors" selected={keepCompetitors} setSelected={setKeepCompetitors} />
        )}
      </div>
      {attempts.map((attempt, i) => (
        <AttemptInput
          key={i}
          attNumber={i + 1}
          attempt={attempt}
          setAttempt={(val: IAttempt) => changeAttempt(i, val)}
          event={event}
          focusNext={() => focusNext(i)}
          memoInputForBld={forResultsSubmissionForm}
          resetTrigger={attemptsResetTrigger}
          allowUnknownTime={isAdmin && [RoundFormat.BestOf1, RoundFormat.BestOf2].includes(roundFormat)}
        />
      ))}
      <div className="mb-3">
        {loadingRecordPairs ? (
          <Loading small dontCenter />
        ) : (
          <div>
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
          </div>
        )}
      </div>
    </>
  );
};

export default ResultForm;
