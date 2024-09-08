'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useMyFetch } from '~/helpers/customHooks';
import ResultForm from './ResultForm';
import ToastMessages from '@c/UI/ToastMessages';
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
import { getUserInfo, shortenEventName } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { MainContext } from '~/helpers/contexts';
import { getBestAndAverage } from '@sh/sharedFunctions';

const userInfo: IUserInfo = getUserInfo();

const DataEntryScreen = ({
  compData: { contest, persons: prevPersons, activeRecordTypes, recordPairsByEvent: initialRecordPairs },
}: {
  compData: IContestData;
}) => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeErrorMessages, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const eventId = searchParams.get('eventId') ?? contest.events[0].event.eventId;

  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true); // trigger reset on page load
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
      if (contest.state < ContestState.Approved)
        changeErrorMessages(["This contest hasn't been approved yet. Submitting results is disabled."]);
      else if (contest.state >= ContestState.Finished)
        changeErrorMessages(['This contest is over. Submitting results is disabled.']);
    }
  }, [contest, recordPairsByEvent, isEditable]);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById('Competitor_1').focus();
  }, [round.roundId]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async () => {
    if (isEditable) {
      if (currentPersons.some((p) => !p)) {
        changeErrorMessages(['Invalid person(s)']);
        return;
      }

      const { best, average } = getBestAndAverage(attempts, currEvent, { round });
      const newResult: IResult = {
        competitionId: contest.competitionId,
        eventId: currEvent.eventId,
        date: new Date(), // real date assigned on the backend
        personIds: currentPersons.map((p) => p.personId),
        ranking: 0, // real rankings assigned on the backend
        attempts, // attempts that got cancelled due to not making cutoff are removed on the backend
        best,
        average,
      };
      let updatedRound: IRound, errors: string[];

      if (resultUnderEdit === null) {
        const { payload, errors: err } = await myFetch.post(`/results/${round.roundId}`, newResult, {
          loadingId: 'submit_attempt_button',
        });
        updatedRound = payload;
        errors = err;
      } else {
        const updateResultDto: IUpdateResultDto = {
          date: newResult.date,
          personIds: newResult.personIds,
          attempts: newResult.attempts,
        };
        const { payload, errors: err } = await myFetch.patch(
          `/results/${(resultUnderEdit as any)._id}`,
          updateResultDto,
          { loadingId: 'submit_attempt_button' },
        );
        updatedRound = payload;
        errors = err;
        setResultUnderEdit(null);
      }

      if (!errors) {
        // Add new persons to list of persons
        setPersons([...persons, ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId))]);
        setResultFormResetTrigger(!resultFormResetTrigger);
        updateRoundAndCompEvents(updatedRound);
        updateRecordPairs(newResult);
      }
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
        { authorize: true, loadingId: null },
      );

      if (errors) changeErrorMessages(errors);
      else setRecordPairsByEvent(payload);
    }
  };

  const editResult = (result: IResult) => {
    if (isEditable) {
      resetMessagesAndLoadingId();
      setResultUnderEdit(result);
      setAttempts(result.attempts);
      setCurrentPersons(persons.filter((p) => result.personIds.includes(p.personId)));
      setResultFormResetTrigger(undefined);
      window.scrollTo(0, 0);
    }
  };

  const deleteResult = async (resultId: string) => {
    if (isEditable) {
      const answer = confirm('Are you sure you want to delete this result?');

      if (answer) {
        const { payload, errors } = await myFetch.delete(`/results/${resultId}`, {
          loadingId: `delete_result_${resultId}_button`,
        });

        if (!errors) updateRoundAndCompEvents(payload);
      }
    }
  };

  const updateQueuePosition = async (mode: 'decrement' | 'increment' | 'reset') => {
    const { payload, errors } = await myFetch.patch(
      `/competitions/queue-${mode}/${contest.competitionId}`,
      {},
      { loadingId: `queue_${mode}_button` },
    );

    if (!errors) setQueuePosition(payload);
  };

  return (
    <div>
      <ToastMessages />

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
              round={round}
              setRound={setRound}
              rounds={contestEvents.find((el) => el.event.eventId === currEvent.eventId).rounds}
              contestEvents={contestEvents}
              disableMainSelects={resultUnderEdit !== null}
            />
            <Button id="submit_attempt_button" onClick={submitResult} disabled={!isEditable} loadingId={loadingId}>
              Submit
            </Button>
            {contest.queuePosition !== undefined && (
              <>
                <p className="mt-4 mb-2">Current position in queue:</p>
                <div className="d-flex align-items-center gap-3">
                  <Button
                    id="queue_decrement_button"
                    onClick={() => updateQueuePosition('decrement')}
                    loadingId={loadingId}
                    className="btn-success btn-xs"
                    ariaLabel="Decrement queue position"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </Button>
                  <p className="mb-0 fs-5 fw-bold">{queuePosition}</p>
                  <Button
                    id="queue_increment_button"
                    onClick={() => updateQueuePosition('increment')}
                    loadingId={loadingId}
                    className="btn-success btn-xs"
                    ariaLabel="Increment queue position"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                  <Button
                    id="queue_reset_button"
                    onClick={() => updateQueuePosition('reset')}
                    loadingId={loadingId}
                    className="btn-xs"
                  >
                    Reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-9">
          <h3 className="mt-2 mb-4 text-center">
            {contest.shortName} &ndash; {shortenEventName(currEvent.name)}
          </h3>

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
