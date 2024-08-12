'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import ResultForm from './ResultForm';
import ErrorMessages from '@c/UI/ErrorMessages';
import Button from '@c/UI/Button';
import RoundResultsTable from '@c/RoundResultsTable';
import {
  IContestEvent,
  IContestData,
  IResult,
  IPerson,
  IRound,
  IAttempt,
  IEventRecordPairs,
  IUpdateResultDto,
} from '@sh/types';
import { ContestState } from '@sh/enums';
import { checkErrorsBeforeResultSubmission, getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { roundFormats } from '@sh/roundFormats';
import { useScrollToTopForNewMessage } from '~/helpers/clientSideFunctions';

const userInfo: IUserInfo = getUserInfo();

const DataEntryScreen = ({
  compData: { contest, persons: prevPersons, activeRecordTypes, recordPairsByEvent: initialRecordPairs },
}: {
  compData: IContestData;
}) => {
  const searchParams = useSearchParams();

  const eventId = searchParams.get('eventId') ?? contest.events[0].event.eventId;

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true); // trigger reset on page load
  const [loadingId, setLoadingId] = useState('');
  const [resultUnderEdit, setResultUnderEdit] = useState<IResult | null>(null);
  const [recordPairsByEvent, setRecordPairsByEvent] = useState<IEventRecordPairs[]>(initialRecordPairs);

  const [round, setRound] = useState<IRound>(contest.events.find((ce) => ce.event.eventId === eventId).rounds[0]);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([null]);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  const [persons, setPersons] = useState<IPerson[]>(prevPersons);
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>(contest.events);
  const [queuePosition, setQueuePosition] = useState(contest.queuePosition);

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
          let updatedRound: IRound, errors: string[];
          setLoadingId('submit_attempt_button');

          if (resultUnderEdit === null) {
            const { payload, errors: err } = await myFetch.post(`/results/${round.roundId}`, newResultWithBestAndAvg);
            updatedRound = payload;
            errors = err;
          } else {
            const updateResultDto: IUpdateResultDto = {
              date: newResultWithBestAndAvg.date,
              unapproved: resultUnderEdit.unapproved,
              personIds: newResultWithBestAndAvg.personIds,
              attempts: newResultWithBestAndAvg.attempts,
            };
            const { payload, errors: err } = await myFetch.patch(
              `/results/${(resultUnderEdit as any)._id}`,
              updateResultDto,
            );
            updatedRound = payload;
            errors = err;
            setResultUnderEdit(null);
          }

          setLoadingId('');

          if (errors) {
            setErrorMessages(errors);
          } else {
            // Add new persons to list of persons
            setPersons([
              ...persons,
              ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId)),
            ]);
            setResultFormResetTrigger(!resultFormResetTrigger);
            updateRoundAndCompEvents(updatedRound);
            updateRecordPairs(newResultWithBestAndAvg);
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
        : { ...ce, rounds: ce.rounds.map((r) => (r.roundId !== updatedRound.roundId ? r : updatedRound)) },
    );

    setContestEvents(newContestEvents);
  };

  const updateRecordPairs = async (newResult: IResult) => {
    const eventRecordPair = recordPairsByEvent.find((el) => el.eventId === newResult.eventId);

    // TO-DO: ADD SUPPORT FOR DETECTING CHANGES BASED ON THE TYPE OF RECORD IT IS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (
      newResult.best < eventRecordPair.recordPairs[0].best ||
      newResult.average < eventRecordPair.recordPairs[0].average
    ) {
      const { payload, errors } = await myFetch.get(
        `/results/record-pairs/${contest.startDate}/${contest.events.map((e) => e.event.eventId).join(',')}`,
        { authorize: true },
      );

      if (errors) setErrorMessages(errors);
      else setRecordPairsByEvent(payload);
    }
  };

  const editResult = (result: IResult) => {
    if (isEditable) {
      const expectedAttempts = roundFormats.find((rf) => rf.value === round.format)?.attempts;
      // If the competitor did not make cutoff, fill the missing attempts with empty results
      const newAttempts = [
        ...result.attempts,
        ...new Array(expectedAttempts - result.attempts.length).fill({ result: 0 }),
      ];

      setResultUnderEdit(result);
      setAttempts(newAttempts);
      setCurrentPersons(persons.filter((p) => result.personIds.includes(p.personId)));
      setResultFormResetTrigger(undefined);
      setErrorMessages([]);
    }
  };

  const deleteResult = async (resultId: string) => {
    if (isEditable) {
      const answer = confirm('Are you sure you want to delete this result?');

      if (answer) {
        setLoadingId(`delete_result_${resultId}_button`);

        const { payload, errors } = await myFetch.delete(`/results/${resultId}`);

        if (errors) {
          setErrorMessages(errors);
        } else {
          setLoadingId('');
          setErrorMessages([]);
          updateRoundAndCompEvents(payload);
        }
      }
    }
  };

  const updateQueuePosition = async (mode: 'decrement' | 'increment' | 'reset') => {
    setLoadingId(`queue_${mode}_button`);

    const { payload, errors } = await myFetch.patch(`/competitions/queue-${mode}/${contest.competitionId}`);

    if (!errors) setQueuePosition(payload);

    setErrorMessages(errors || []);
    setLoadingId('');
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
              disableMainSelects={resultUnderEdit !== null}
            />
            <Button
              id="submit_attempt_button"
              text="Submit"
              onClick={submitResult}
              disabled={!isEditable}
              loadingId={loadingId}
            />
            {contest.queuePosition !== undefined && (
              <>
                <p className="mt-4 mb-3">Current position in queue:</p>
                <div className="d-flex align-items-center gap-3">
                  <Button
                    id="queue_decrement_button"
                    text="–"
                    onClick={() => updateQueuePosition('decrement')}
                    loadingId={loadingId}
                    className="btn-success"
                  />
                  <p className="mb-0 fs-5 fw-bold">{queuePosition}</p>
                  <Button
                    id="queue_increment_button"
                    text="+"
                    onClick={() => updateQueuePosition('increment')}
                    loadingId={loadingId}
                    className="btn-success"
                  />
                  <Button
                    id="queue_reset_button"
                    text="Reset"
                    onClick={() => updateQueuePosition('reset')}
                    loadingId={loadingId}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-9">
          <h2 className="my-2 mb-4 text-center">Enter results for {contest.shortName}</h2>

          <RoundResultsTable
            round={round}
            event={currEvent}
            persons={persons}
            recordTypes={activeRecordTypes}
            onEditResult={editResult}
            onDeleteResult={deleteResult}
            disableEditAndDelete={!isEditable || resultUnderEdit !== null}
            loadingId={loadingId}
          />
        </div>
      </div>
    </div>
  );
};

export default DataEntryScreen;
