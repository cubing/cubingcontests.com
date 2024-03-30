'use client';

import { useState, useEffect, useMemo } from 'react';
import myFetch from '~/helpers/myFetch';
import ResultForm from './ResultForm';
import ErrorMessages from '@c/UI/ErrorMessages';
import Button from '@c/UI/Button';
import RoundResultsTable from '@c/RoundResultsTable';
import { IContestEvent, IContestData, IResult, IPerson, IRound, IAttempt, IEventRecordPairs } from '@sh/interfaces';
import { ContestState } from '@sh/enums';
import { checkErrorsBeforeResultSubmission, getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { roundFormats } from '@sh/roundFormats';
import { useScrollToTopForNewMessage } from '~/helpers/clientSideFunctions';

const userInfo: IUserInfo = getUserInfo();

const PostResultsScreen = ({
  compData: { contest, persons: prevPersons, activeRecordTypes, recordPairsByEvent: initialRecordPairs },
}: {
  compData: IContestData;
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true); // trigger reset on page load
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [recordPairsByEvent, setRecordPairsByEvent] = useState<IEventRecordPairs[]>(initialRecordPairs);

  const [round, setRound] = useState<IRound>(contest.events[0].rounds[0]);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([null]);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  const [persons, setPersons] = useState<IPerson[]>(prevPersons);
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>(contest.events);

  const currEvent = useMemo(
    () => contest.events.find((ev) => ev.event.eventId === round.roundId.split('-')[0]).event,
    [contest, round.roundId],
  );
  const recordPairs = useMemo(
    () => recordPairsByEvent.find((el) => el.eventId === currEvent.eventId).recordPairs,
    [recordPairsByEvent, currEvent],
  );

  const isEditable = userInfo.isAdmin || [ContestState.Approved, ContestState.Ongoing].includes(contest.state);

  useEffect(() => {
    if (!isEditable) {
      if (contest.state < ContestState.Approved) {
        setErrorMessages(["This contest hasn't been approved yet. Submitting results is disabled."]);
      } else if (contest.state >= ContestState.Finished) {
        setErrorMessages(['This contest is over. Submitting results is disabled.']);
      }
    }
  }, [contest, recordPairsByEvent, isEditable]);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById('Competitor_1').focus();
  }, [round.roundId]);

  useScrollToTopForNewMessage({ errorMessages, successMessage });

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = () => {
    if (isEditable) {
      const newResult: IResult = {
        competitionId: contest.competitionId,
        eventId: currEvent.eventId,
        date: new Date(), // real date assigned on the backend
        personIds: currentPersons.map((el) => el?.personId || null),
        ranking: 0, // real rankings assigned on the backend
        attempts, // attempts that got cancelled due to not making cutoff are removed on the backend
        best: -1, // this gets set below
        average: -1, // this gets set below
      };

      checkErrorsBeforeResultSubmission(
        newResult,
        currEvent,
        currentPersons,
        setErrorMessages,
        setSuccessMessage,
        async (newResultWithBestAndAvg) => {
          setLoadingDuringSubmit(true);

          const { payload, errors } = await myFetch.post(`/results/${round.roundId}`, newResultWithBestAndAvg);

          setLoadingDuringSubmit(false);

          if (errors) {
            setErrorMessages(errors);
          } else {
            const eventRecordPair = recordPairsByEvent.find((el) => el.eventId === newResult.eventId);
            if (
              newResultWithBestAndAvg.best < eventRecordPair.recordPairs[0].best ||
              newResultWithBestAndAvg.average < eventRecordPair.recordPairs[0].average
            ) {
              const { payload, errors } = await myFetch.get(`/competitions/mod/${contest.competitionId}`, {
                authorize: true,
              });

              if (errors) {
                setErrorMessages(errors);
                return;
              } else {
                console.log('New records:', payload.recordPairsByEvent);
                setRecordPairsByEvent(payload.recordPairsByEvent);
              }
            }

            // Add new persons to list of persons
            setPersons([
              ...persons,
              ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId)),
            ]);
            setResultFormResetTrigger(!resultFormResetTrigger);
            updateRoundAndCompEvents(payload);
          }
        },
        { round },
      );
    }
  };

  const updateRoundAndCompEvents = (updatedRound: IRound) => {
    setRound(updatedRound);

    const newContestEvents = contestEvents.map((ce) =>
      ce.event.eventId !== currEvent.eventId
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((r) => (r.roundId !== updatedRound.roundId ? r : updatedRound)),
          },
    );

    setContestEvents(newContestEvents);
  };

  const editResult = (result: IResult) => {
    // Delete result and then set the inputs if the deletion was successful
    deleteResult((result as any)._id, () => {
      const expectedAttempts = roundFormats.find((rf) => rf.value === round.format)?.attempts;
      // If the competitor did not make cutoff, fill the missing attempts with empty results
      const newAttempts = [
        ...result.attempts,
        ...new Array(expectedAttempts - result.attempts.length).fill({ result: 0 }),
      ];

      setAttempts(newAttempts);
      setCurrentPersons(persons.filter((p) => result.personIds.includes(p.personId)));
      setResultFormResetTrigger(undefined);
    });
  };

  const deleteResult = async (resultId: string, editCallback?: () => void) => {
    if (isEditable) {
      setLoadingDuringSubmit(true);

      const { payload, errors } = await myFetch.delete(`/results/${contest.competitionId}/${resultId}`);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setLoadingDuringSubmit(false);
        setErrorMessages([]);
        updateRoundAndCompEvents(payload);

        if (editCallback) editCallback();
      }
    }
  };

  return (
    <div>
      {errorMessages.length > 0 ? (
        <ErrorMessages errorMessages={errorMessages} />
      ) : (
        successMessage && <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}

      <div className="row py-4">
        <div className="col-lg-3 mb-4">
          <div className="px-2">
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
              rounds={contestEvents.find((el) => el.event.eventId === currEvent.eventId).rounds}
              contestEvents={contestEvents}
            />
            <Button
              id="submit_attempt_button"
              text="Submit"
              onClick={submitResult}
              disabled={!isEditable}
              loading={loadingDuringSubmit}
            />
          </div>
        </div>

        <div className="col-lg-9">
          <h2 className="my-2 mb-4 text-center">Enter results for {contest.name}</h2>

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
  );
};

export default PostResultsScreen;
