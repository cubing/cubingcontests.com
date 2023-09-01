'use client';

import { useState, useEffect, useMemo } from 'react';
import { ICompetitionEvent, ICompetitionData, IResult, IPerson, IRound } from '@sh/interfaces';
import RoundResultsTable from '@c/RoundResultsTable';
import myFetch from '~/helpers/myFetch';
import { CompetitionState } from '@sh/enums';
import { formatTime, checkErrorsBeforeSubmit } from '~/helpers/utilityFunctions';
import ResultForm from './ResultForm';
import { IResultInfo } from '~/helpers/interfaces/ResultInfo';
import ErrorMessages from '../ErrorMessages';
import Loading from '../Loading';

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
  const [attempts, setAttempts] = useState<string[]>([]);
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

  const isEditable = [CompetitionState.Approved, CompetitionState.Ongoing].includes(competition.state);

  useEffect(() => {
    console.log('Records:', recordPairsByEvent);

    if (competition.state < CompetitionState.Approved) {
      setErrorMessages(["This competition hasn't been approved yet. Submitting results is disabled."]);
    } else if (competition.state >= CompetitionState.Finished) {
      setErrorMessages(['This competition is over. Submitting results is disabled.']);
    }
  }, [competition, recordPairsByEvent]);

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
      checkErrorsBeforeSubmit(
        attempts,
        round.format,
        currEvent,
        currentPersons,
        setErrorMessages,
        setSuccessMessage,
        async ({ parsedAttempts, best, average }: IResultInfo) => {
          setLoadingDuringSubmit(true);

          const newResult = {
            competitionId: competition.competitionId,
            eventId: currEvent.eventId,
            date: round.date,
            compNotPublished: true,
            personIds: currentPersons.map((el) => el.personId),
            ranking: 0, // real rankings assigned on the backend
            attempts: parsedAttempts,
            best,
            average,
          };

          const { payload, errors } = await myFetch.post(`/results/${round.roundId}`, newResult);

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
    } else {
      setErrorMessages(['Submitting results is disabled']);
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
      const newCurrentPersons = persons.filter((p) => result.personIds.includes(p.personId));
      setCurrentPersons(newCurrentPersons);

      const newAttempts = result.attempts.map((el) => formatTime(el, currEvent, { removeFormatting: true }));
      setAttempts(newAttempts);

      document.getElementById('attempt_1').focus();
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

        if (editCallback) {
          editCallback();
        } else {
          setResultFormResetTrigger(!resultFormResetTrigger);
        }
      }
    } else {
      setErrorMessages(['Deleting and editing results is disabled']);
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
        <div className="col-3 pe-4">
          <ResultForm
            event={currEvent}
            competitionEvents={competitionEvents}
            persons={currentPersons}
            setPersons={setCurrentPersons}
            attempts={attempts}
            setAttempts={setAttempts}
            round={round}
            setRound={setRound}
            rounds={competitionEvents.find((el) => el.event.eventId === currEvent.eventId).rounds}
            recordPairs={recordPairs}
            recordTypes={activeRecordTypes}
            nextFocusTargetId="submit_attempt_button"
            setErrorMessages={setErrorMessages}
            setSuccessMessage={setSuccessMessage}
            resetTrigger={resultFormResetTrigger}
          />
          <button type="button" id="submit_attempt_button" onClick={submitResult} className="btn btn-primary">
            {!loadingDuringSubmit ? (
              'Submit'
            ) : (
              <div style={{ width: '3.15rem' }}>
                <Loading small />
              </div>
            )}
          </button>
        </div>
        <div className="col-9">
          <h2 className="mb-4 text-center">
            {competitionEvents.length > 0 ? 'Edit' : 'Post'} results for&nbsp;
            {competition.name}
          </h2>
          {/* THIS STYLING IS A TEMPORARY SOLUTION!!! */}
          <div className="overflow-y-auto" style={{ maxHeight: '650px' }}>
            <RoundResultsTable
              round={round}
              event={currEvent}
              persons={persons}
              recordTypes={activeRecordTypes}
              onEditResult={editResult}
              onDeleteResult={deleteResult}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PostResultsScreen;
