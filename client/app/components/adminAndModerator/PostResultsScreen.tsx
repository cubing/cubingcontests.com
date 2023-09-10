'use client';

import { useState, useEffect, useMemo } from 'react';
import { ICompetitionEvent, ICompetitionData, IResult, IPerson, IRound, IAttempt } from '@sh/interfaces';
import RoundResultsTable from '@c/RoundResultsTable';
import myFetch from '~/helpers/myFetch';
import { ContestState, Role } from '@sh/enums';
import { checkErrorsBeforeSubmit, getRole } from '~/helpers/utilityFunctions';
import ResultForm from './ResultForm';
import ErrorMessages from '../ErrorMessages';
import Loading from '../Loading';

const role = getRole();

const PostResultsScreen = ({
  compData: { competition, persons: prevPersons, activeRecordTypes, recordPairsByEvent },
}: {
  compData: ICompetitionData;
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true);
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);

  const [round, setRound] = useState<IRound>(competition.events[0].rounds[0]);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([null]);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  const [persons, setPersons] = useState<IPerson[]>(prevPersons);
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>(competition.events);

  const currEvent = useMemo(
    () => competition.events.find((ev) => ev.event.eventId === round.roundId.split('-')[0]).event,
    [competition, round.roundId],
  );
  const recordPairs = useMemo(
    () => recordPairsByEvent.find((el) => el.eventId === currEvent.eventId).recordPairs,
    [recordPairsByEvent, currEvent],
  );

  const isEditable = role === Role.Admin || [ContestState.Approved, ContestState.Ongoing].includes(competition.state);

  useEffect(() => {
    console.log('Records:', recordPairsByEvent);

    if (!isEditable) {
      if (competition.state < ContestState.Approved) {
        setErrorMessages(["This contest hasn't been approved yet. Submitting results is disabled."]);
      } else if (competition.state >= ContestState.Finished) {
        setErrorMessages(['This contest is over. Submitting results is disabled.']);
      }
    }
  }, [competition, recordPairsByEvent, isEditable]);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById('Competitor_1').focus();
  }, [round.roundId]);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  const submitResult = () => {
    if (isEditable) {
      const newResult: IResult = {
        competitionId: competition.competitionId,
        eventId: currEvent.eventId,
        date: round.date,
        personIds: currentPersons.map((el) => el?.personId || null),
        ranking: 0, // real rankings assigned on the backend
        attempts,
        best: -1,
        average: -1,
      };

      if (competition.state < ContestState.Finished) newResult.compNotPublished = true;

      checkErrorsBeforeSubmit(
        newResult,
        round.format,
        currEvent,
        currentPersons,
        setErrorMessages,
        setSuccessMessage,
        async (newResultWithBestAndAverage) => {
          setLoadingDuringSubmit(true);

          const { payload, errors } = await myFetch.post(`/results/${round.roundId}`, newResultWithBestAndAverage);

          if (errors) {
            setErrorMessages(errors);
          } else {
            setLoadingDuringSubmit(false);
            // Add new persons to list of persons
            setPersons([
              ...persons,
              ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId)),
            ]);
            setResultFormResetTrigger(!resultFormResetTrigger);
            updateRoundAndCompEvents(payload);
          }
        },
      );
    }
  };

  const updateRoundAndCompEvents = (updatedRound: IRound) => {
    setRound(updatedRound);

    const newCompetitionEvents = competitionEvents.map((ce) =>
      ce.event.eventId !== currEvent.eventId
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((r) => (r.roundId !== updatedRound.roundId ? r : updatedRound)),
          },
    );

    setCompetitionEvents(newCompetitionEvents);
  };

  const editResult = (result: IResult) => {
    // Delete result and then set the inputs if the deletion was successful
    deleteResult((result as any)._id, () => {
      setCurrentPersons(persons.filter((p) => result.personIds.includes(p.personId)));
      setAttempts(result.attempts);
    });
  };

  const deleteResult = async (resultId: string, editCallback?: () => void) => {
    if (isEditable) {
      setLoadingDuringSubmit(true);

      const { payload, errors } = await myFetch.delete(`/results/${competition.competitionId}/${resultId}`);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setLoadingDuringSubmit(false);
        updateRoundAndCompEvents(payload);

        if (editCallback) editCallback();
        else setErrorMessages([]);
      }
    }
  };

  return (
    <>
      {errorMessages.length > 0 ? (
        <ErrorMessages errorMessages={errorMessages} />
      ) : (
        successMessage && <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}
      <div className="row my-4">
        <div className="col-4 pe-4">
          <ResultForm
            event={currEvent}
            persons={currentPersons}
            setPersons={setCurrentPersons}
            attempts={attempts}
            setAttempts={setAttempts}
            recordPairs={recordPairs}
            recordTypes={activeRecordTypes}
            nextFocusTargetId="submit_attempt_button"
            resetTrigger={resultFormResetTrigger}
            setErrorMessages={setErrorMessages}
            setSuccessMessage={setSuccessMessage}
            round={round}
            setRound={setRound}
            rounds={competitionEvents.find((el) => el.event.eventId === currEvent.eventId).rounds}
            competitionEvents={competitionEvents}
          />
          <button
            type="button"
            id="submit_attempt_button"
            onClick={submitResult}
            disabled={!isEditable}
            className="btn btn-primary"
          >
            {!loadingDuringSubmit ? (
              'Submit'
            ) : (
              <div style={{ width: '3.15rem' }}>
                <Loading small />
              </div>
            )}
          </button>
        </div>
        <div className="col-8">
          <h2 className="mb-4 text-center">Enter results for {competition.name}</h2>
          {/* THIS STYLING IS A TEMPORARY SOLUTION!!! */}
          <div className="overflow-y-auto" style={{ maxHeight: '650px' }}>
            <RoundResultsTable
              round={round}
              event={currEvent}
              persons={persons}
              recordTypes={activeRecordTypes}
              onEditResult={editResult}
              onDeleteResult={deleteResult}
              disableEditAndDelete={!isEditable}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PostResultsScreen;
