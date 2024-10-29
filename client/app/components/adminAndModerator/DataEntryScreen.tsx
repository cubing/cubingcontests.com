"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMyFetch } from "~/helpers/customHooks.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Button from "~/app/components/UI/Button.tsx";
import RoundResultsTable from "~/app/components/RoundResultsTable.tsx";
import {
  type IContestData,
  type IContestEvent,
  type ICutoff,
  type IEventRecordPairs,
  type IPerson,
  type IResult,
  type IRound,
  type IRoundFormat,
  type IUpdateResultDto,
} from "~/shared_helpers/types.ts";
import { ContestState, RoundType } from "~/shared_helpers/enums.ts";
import { getBlankCompetitors, getUserInfo, shortenEventName } from "~/helpers/utilityFunctions.ts";
import { type InputPerson, type MultiChoiceOption, UserInfo } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getBestAndAverage, getMakesCutoff } from "~/shared_helpers/sharedFunctions.ts";
import type { IFeAttempt, IRecordPair, IResultDto } from "~/shared_helpers/interfaces/Result.ts";
import EventButtons from "~/app/components/EventButtons.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import BestAndAverage from "~/app/components/adminAndModerator/BestAndAverage.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { roundFormats } from "~/shared_helpers/roundFormats.ts";

const userInfo: UserInfo = getUserInfo();

const DataEntryScreen = ({
  compData: {
    contest,
    persons: prevPersons,
    activeRecordTypes,
    recordPairsByEvent: initialRecordPairs,
  },
}: {
  compData: IContestData;
}) => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeErrorMessages, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const eventId = searchParams.get("eventId") ?? contest.events[0].event.eventId;
  const currContestEvent = contest.events.find((ev) => ev.event.eventId === eventId) as IContestEvent;
  const currEvent = currContestEvent.event;

  const [resultUnderEdit, setResultUnderEdit] = useState<IResult | null>(null);
  const [recordPairsByEvent, setRecordPairsByEvent] = useState<IEventRecordPairs[]>(
    initialRecordPairs as IEventRecordPairs[],
  );
  const [round, setRound] = useState<IRound>(currContestEvent.rounds[0]);

  const roundFormat = roundFormats.find((rf) => rf.value === round.format) as IRoundFormat;

  const [currentPersons, setCurrentPersons] = useState<InputPerson[]>(new Array(currEvent.participants).fill(null));
  const [personNames, setPersonNames] = useState(new Array(currEvent.participants).fill(""));
  const [attempts, setAttempts] = useState<IFeAttempt[]>(new Array(roundFormat.attempts).fill({ result: 0 }));
  const [persons, setPersons] = useState<IPerson[]>(prevPersons);
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>(contest.events);
  const [queuePosition, setQueuePosition] = useState(contest.queuePosition);

  const roundOptions = useMemo<MultiChoiceOption[]>(
    () =>
      currContestEvent.rounds.map((r: IRound) => ({ label: roundTypes[r.roundTypeId].label, value: r.roundTypeId })),
    [currContestEvent],
  );
  const recordPairs = useMemo<IRecordPair[] | undefined>(
    () => recordPairsByEvent.find((erp: IEventRecordPairs) => erp.eventId === eventId)?.recordPairs,
    [recordPairsByEvent, currEvent],
  );

  const isEditable = userInfo?.isAdmin || [ContestState.Approved, ContestState.Ongoing].includes(contest.state);
  const lastActiveAttempt = getMakesCutoff(attempts, round?.cutoff)
    ? attempts.length
    : (round.cutoff as ICutoff).numberOfAttempts;

  useEffect(() => {
    if (!isEditable) {
      if (contest.state < ContestState.Approved) {
        changeErrorMessages(["This contest hasn't been approved yet. Submitting results is disabled."]);
      } else if (contest.state >= ContestState.Finished) {
        changeErrorMessages(["This contest is over. Submitting results is disabled."]);
      }
    }
  }, [contest, recordPairsByEvent, isEditable]);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById("Competitor_1")?.focus();
  }, [round.roundId]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async () => {
    if (isEditable) {
      if (currentPersons.some((p: InputPerson) => !p)) {
        changeErrorMessages(["Invalid person(s)"]);
        return;
      }

      const resultDto: IResultDto = {
        eventId,
        personIds: currentPersons.map((p: InputPerson) => (p as IPerson).personId),
        attempts,
      };
      let updatedRound: IRound, errors: string[] | undefined;

      if (resultUnderEdit === null) {
        const { payload, errors: err } = await myFetch.post(
          `/results/${contest.competitionId}/${round.roundId}`,
          resultDto,
          { loadingId: "submit_attempt_button" },
        );
        updatedRound = payload;
        if (err) errors = err;
      } else {
        const updateResultDto: IUpdateResultDto = { personIds: resultDto.personIds, attempts: resultDto.attempts };
        const { payload, errors: err } = await myFetch.patch(
          `/results/${(resultUnderEdit as any)._id}`,
          updateResultDto,
          { loadingId: "submit_attempt_button" },
        );
        updatedRound = payload;
        if (err) errors = err;
        setResultUnderEdit(null);
      }

      if (!errors) {
        // Add new persons to list of persons
        const newPersons: IPerson[] = [
          ...persons,
          ...currentPersons.filter((cp: InputPerson) =>
            !persons.some((p: IPerson) => p.personId === (cp as IPerson).personId)
          ) as IPerson[],
        ];
        setPersons(newPersons);
        setPersonNames(newPersons.map((p) => p.name));
        changeRound(updatedRound);
        // CODE SMELL!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        const { best, average } = getBestAndAverage(attempts, currEvent, round.format, { cutoff: round.cutoff });
        updateRecordPairs({ ...resultDto, best, average } as IResult);
      }
    }
  };

  const changeRound = (updatedRound: IRound) => {
    setRound(updatedRound);
    setContestEvents(contestEvents.map((ce: IContestEvent) =>
      ce.event.eventId !== eventId ? ce : {
        ...ce,
        rounds: ce.rounds.map((r) => (r.roundId !== updatedRound.roundId ? r : updatedRound)),
      }
    ));
    setAttempts(
      new Array((roundFormats.find((rf) => rf.value === updatedRound.format) as IRoundFormat).attempts)
        .fill({ result: 0 }),
    );
    const [persons, personNames] = getBlankCompetitors(currEvent.participants);
    setCurrentPersons(persons);
    setPersonNames(personNames);
  };

  const changeAttempt = (index: number, newAttempt: IFeAttempt) => {
    setAttempts(attempts.map((a: IFeAttempt, i: number) => (i !== index ? a : newAttempt)));
  };

  const updateRecordPairs = async (newResult: IResult) => {
    const eventRP = recordPairsByEvent.find((erp: IEventRecordPairs) =>
      erp.eventId === newResult.eventId
    ) as IEventRecordPairs;

    // TO-DO: ADD SUPPORT FOR DETECTING CHANGES BASED ON THE TYPE OF RECORD IT IS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (
      eventRP.recordPairs.length > 0 &&
      (newResult.best < eventRP.recordPairs[0].best || newResult.average < eventRP.recordPairs[0].average)
    ) {
      const { payload, errors } = await myFetch.get(
        `/results/record-pairs/${contest.startDate}/${contest.events.map((e) => e.event.eventId).join(",")}`,
        { authorize: true, loadingId: null },
      );

      if (errors) changeErrorMessages(errors);
      else setRecordPairsByEvent(payload);
    }
  };

  const onSelectPerson = (person: IPerson) => {
    if (currentPersons.every((p: InputPerson) => p === null)) {
      const existingResultForSelectedPerson = round.results.find((r: IResult) => r.personIds.includes(person.personId));
      if (existingResultForSelectedPerson) editResult(existingResultForSelectedPerson);
    }
  };

  const editResult = (result: IResult) => {
    if (isEditable) {
      resetMessagesAndLoadingId();
      setResultUnderEdit(result);
      setAttempts(result.attempts);
      const newCurrentPersons: IPerson[] = result.personIds.map((pid) =>
        persons.find((p: IPerson) => p.personId === pid) as IPerson
      );
      setCurrentPersons(newCurrentPersons);
      setPersonNames(newCurrentPersons.map((p) => p.name));
      window.scrollTo(0, 0);
    }
  };

  const deleteResult = async (resultId: string) => {
    if (isEditable) {
      const answer = confirm("Are you sure you want to delete this result?");

      if (answer) {
        const { payload, errors } = await myFetch.delete(`/results/${resultId}`, {
          loadingId: `delete_result_${resultId}_button`,
        });

        if (!errors) changeRound(payload);
      }
    }
  };

  const updateQueuePosition = async (mode: "decrement" | "increment" | "reset") => {
    const { payload, errors } = await myFetch.patch(
      `/competitions/queue-${mode}/${contest.competitionId}`,
      {},
      { loadingId: `queue_${mode}_button` },
    );

    if (!errors) setQueuePosition(payload);
  };

  return (
    <div className="px-2">
      <ToastMessages />

      <div className="row py-4">
        <div className="col-lg-3 mb-4">
          <div>
            <EventButtons
              eventId={eventId}
              events={contestEvents?.map((e: IContestEvent) => e.event)}
              forPage="data-entry"
            />
            <FormSelect
              title="Round"
              options={roundOptions}
              selected={round.roundTypeId}
              setSelected={(val: RoundType) =>
                changeRound(currContestEvent.rounds.find((r) => r.roundTypeId === val) as IRound)}
              disabled={resultUnderEdit !== null}
            />
            <FormPersonInputs
              title="Competitor"
              personNames={personNames}
              setPersonNames={setPersonNames}
              onSelectPerson={onSelectPerson}
              persons={currentPersons}
              setPersons={setCurrentPersons}
              nextFocusTargetId="attempt_1"
              redirectToOnAddPerson={window.location.pathname}
              noGrid
            />
            {attempts.map((attempt: IFeAttempt, i: number) => (
              <AttemptInput
                key={i}
                attNumber={i + 1}
                attempt={attempt}
                setAttempt={(val: IFeAttempt) => changeAttempt(i, val)}
                event={currEvent}
                nextFocusTargetId={i + 1 === lastActiveAttempt ? "submit_attempt_button" : undefined}
                timeLimit={round.timeLimit}
                disabled={i + 1 > lastActiveAttempt}
              />
            ))}
            {loadingId === "RECORD_PAIRS" ? <Loading small dontCenter /> : (
              <BestAndAverage
                event={currEvent}
                roundFormat={round.format}
                attempts={attempts}
                recordPairs={recordPairs}
                recordTypes={activeRecordTypes}
                cutoff={round.cutoff}
              />
            )}
            <Button
              id="submit_attempt_button"
              onClick={submitResult}
              disabled={!isEditable}
              loadingId={loadingId}
              className="mt-3"
            >
              Submit
            </Button>
            {contest.queuePosition !== undefined && (
              <>
                <p className="mt-4 mb-2">Current position in queue:</p>
                <div className="d-flex align-items-center gap-3">
                  <Button
                    id="queue_decrement_button"
                    onClick={() => updateQueuePosition("decrement")}
                    loadingId={loadingId}
                    className="btn-success btn-xs"
                    ariaLabel="Decrement queue position"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </Button>
                  <p className="mb-0 fs-5 fw-bold">{queuePosition}</p>
                  <Button
                    id="queue_increment_button"
                    onClick={() => updateQueuePosition("increment")}
                    loadingId={loadingId}
                    className="btn-success btn-xs"
                    ariaLabel="Increment queue position"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                  <Button
                    id="queue_reset_button"
                    onClick={() => updateQueuePosition("reset")}
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
          <h3 className="mt-2 mb-4 text-center">{contest.shortName} &ndash; {shortenEventName(currEvent.name)}</h3>

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
