"use client";

import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toZonedTime } from "date-fns-tz";
import { usePathname } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useEffect, useMemo, useState } from "react";
import z from "zod";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import BestAndAverage from "~/app/components/adminAndModerator/BestAndAverage.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import RoundResultsTable from "~/app/components/RoundResultsTable.tsx";
import Button from "~/app/components/UI/Button.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { getDateOnly, getMakesCutoff, getMaxAllowedRounds, getRoundDate } from "~/helpers/sharedFunctions.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { EventWrPair, InputPerson, RoundFormat, RoundType } from "~/helpers/types.ts";
import { getActionError, getBlankCompetitors, shortenEventName } from "~/helpers/utilityFunctions.ts";
import { type ResultDto, ResultValidator } from "~/helpers/validators/Result.ts";
import type { SelectContest } from "~/server/db/schema/contests.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { Attempt, ResultResponse } from "~/server/db/schema/results.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";
import { getPersonByIdSF } from "~/server/serverFunctions/personServerFunctions.ts";
import { createContestResultSF, getWrPairUpToDateSF } from "~/server/serverFunctions/resultServerFunctions.ts";

type Props = {
  contest: Pick<SelectContest, "competitionId" | "shortName" | "type" | "startDate" | "queuePosition" | "schedule">;
  eventId: string;
  events: EventResponse[];
  rounds: RoundResponse[];
  results: ResultResponse[];
  persons: PersonResponse[];
  recordConfigs: RecordConfigResponse[];
};

function DataEntryScreen({
  contest,
  eventId,
  events,
  rounds,
  results: initResults,
  persons: initPersons,
  recordConfigs,
}: Props) {
  const pathname = usePathname();
  const { changeErrorMessages } = useContext(MainContext);

  const { executeAsync: getWrPairUpToDate, isPending: isPendingWrPairs } = useAction(getWrPairUpToDateSF);
  const { executeAsync: getPersonById, isPending: isGettingPerson } = useAction(getPersonByIdSF);
  const { executeAsync: createResult, isPending: isCreating } = useAction(createContestResultSF);
  const [resultUnderEdit, setResultUnderEdit] = useState<ResultResponse | null>(null);
  const [eventWrPair, setEventWrPair] = useState<EventWrPair | undefined>();
  const [round, setRound] = useState<RoundResponse>(rounds[0]);
  const [results, setResults] = useState<ResultResponse[]>(initResults);

  const roundFormat = roundFormats.find((rf) => rf.value === round.format)!;
  const currEvent = events.find((e) => e.eventId === eventId)!;

  const [selectedPersons, setSelectedPersons] = useState<InputPerson[]>(new Array(currEvent.participants).fill(null));
  const [personNames, setPersonNames] = useState(new Array(currEvent.participants).fill(""));
  const [attempts, setAttempts] = useState<Attempt[]>(new Array(roundFormat.attempts).fill({ result: 0 }));
  const [persons, setPersons] = useState<PersonResponse[]>(initPersons);
  const [queuePosition, setQueuePosition] = useState(contest.queuePosition);
  const [loadingId, setLoadingId] = useState("");

  const roundOptions = useMemo<MultiChoiceOption[]>(
    () => rounds.map((r) => ({ label: roundTypes[r.roundTypeId].label, value: r.roundTypeId })),
    [rounds],
  );

  const isPending = isCreating || isGettingPerson || isPendingWrPairs;
  const maxAllowedRounds = getMaxAllowedRounds(rounds, results);
  const isOpenableRound = !round.open && maxAllowedRounds >= round.roundNumber;
  const lastActiveAttempt = getMakesCutoff(attempts, round.cutoffAttemptResult, round.cutoffNumberOfAttempts)
    ? attempts.length
    : round.cutoffNumberOfAttempts!; // getMakesCutoff returns true if this is falsy anyways

  useEffect(() => {
    updateEventWrPair();
  }, []);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById("Competitor_1")?.focus();
  }, [round]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async () => {
    const parsed = ResultValidator.safeParse({
      eventId,
      personIds: selectedPersons.map((p) => p?.id),
      attempts,
      competitionId: contest.competitionId,
      roundId: round.id,
    });

    if (!parsed.success) {
      changeErrorMessages([z.prettifyError(parsed.error)]);
    } else {
      const res = await createResult({ newResultDto: parsed.data });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        addNewPersonsToList();
        resetSelectedPersonsAndAttempts();
        // This assumes that there is only one result per person in a given round, which should always be the case
        const result = res.data!.find(
          (r) => r.roundId === parsed.data.roundId && r.personIds.includes(parsed.data.personIds[0]),
        );
        if (!result) throw new Error("Submitted result not found in response data");
        setResults(res.data!);
        updateEventWrPair(result);
      }
    }

    // if (resultUnderEdit === null) {
    //   const res = await myFetch.post(`/results/${contest.competitionId}/${round.roundId}`, resultDto, {
    //     loadingId: "submit_attempt_button",
    //   });
    //   if (!res.success) tempErrors = res.error;
    //   else updatedRound = res.data;
    // } else {
    //   const updateResultDto: IUpdateResultDto = {
    //     personIds: resultDto.personIds,
    //     attempts: resultDto.attempts,
    //   };
    //   const res = await myFetch.patch(`/results/${(resultUnderEdit as any)._id}`, updateResultDto, {
    //     loadingId: "submit_attempt_button",
    //   });
    //   if (!res.success) {
    //     tempRrrors = res.error;
    //   } else {
    //     setResultUnderEdit(null);
    //     updatedRound = res.data;
    //   }
    // }
  };

  const addNewPersonsToList = (newSelectedPersons = selectedPersons as PersonResponse[]) => {
    const newPersons: PersonResponse[] = [
      ...persons,
      ...newSelectedPersons.filter((sp) => !persons.some((p) => p.id === sp.id)),
    ];
    setPersons(newPersons);
    setPersonNames(newPersons.map((p) => p.name));
  };

  const updateRound = (newRound: RoundResponse) => {
    setRound(newRound);
    resetSelectedPersonsAndAttempts(newRound.format);
  };

  const resetSelectedPersonsAndAttempts = (newRoundFormat: RoundFormat = round.format) => {
    setAttempts(new Array(roundFormats.find((rf) => rf.value === newRoundFormat)!.attempts).fill({ result: 0 }));
    const [persons, personNames] = getBlankCompetitors(currEvent.participants);
    setSelectedPersons(persons);
    setPersonNames(personNames);
  };

  const changeAttempt = (index: number, newAttempt: Attempt) => {
    setAttempts(attempts.map((a: Attempt, i: number) => (i !== index ? a : newAttempt)));
  };

  const updateEventWrPair = async (newResult?: Pick<ResultResponse, "best" | "average">) => {
    if (
      !newResult ||
      !eventWrPair?.best ||
      newResult.best < eventWrPair.best ||
      !eventWrPair?.average ||
      newResult.average < eventWrPair.average
    ) {
      const res = await getWrPairUpToDate({
        recordCategory: contest.type === "meetup" ? "meetups" : "competitions",
        eventId,
        recordsUpTo: getRoundDate(round, contest),
      });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else setEventWrPair(res.data!);
    }
  };

  const onSelectPerson = (person: PersonResponse) => {
    if (selectedPersons.every((p) => p === null)) {
      const existingResultForSelectedPerson = results.find((r) => r.personIds.includes(person.id));
      if (existingResultForSelectedPerson) editResult(existingResultForSelectedPerson);
    }
  };

  const editResult = (result: ResultResponse) => {
    throw new Error("NOT IMPLEMENTED!");

    // resetMessages();
    // setResultUnderEdit(result);
    // setAttempts(
    //   getMakesCutoff(result.attempts, round.cutoff)
    //     ? result.attempts
    //     : [
    //         ...result.attempts,
    //         ...new Array(roundFormat.attempts - (round.cutoff as ICutoff).numberOfAttempts).fill({ result: 0 }),
    //       ],
    // );
    // const newCurrentPersons: PersonResponse[] = result.personIds.map(
    //   (pid) => persons.find((p: PersonResponse) => p.personId === pid)!,
    // );
    // setSelectedPersons(newCurrentPersons);
    // setPersonNames(newCurrentPersons.map((p) => p.name));
    // window.scrollTo(0, 0);
  };

  const deleteResult = async (resultId: number) => {
    throw new Error("NOT IMPLEMENTED!");
    // setLoadingId(`delete_result_${resultId}_button` )

    // if (confirm("Are you sure you want to delete this result?")) {
    //   const res = await myFetch.delete(`/results/${resultId}`, { loadingId: `delete_result_${resultId}_button` });

    //   if (res.success) changeRound(res.data);
    // }
  };

  const updateQueuePosition = async (mode: "decrement" | "increment" | "reset") => {
    throw new Error("NOT IMPLEMENTED!");
    // const res = await myFetch.patch(
    //   `/competitions/queue-${mode}/${contest.competitionId}`,
    //   {},
    //   { loadingId: `queue_${mode}_button` },
    // );

    // if (res.success) setQueuePosition(res.data);
  };

  const openRound = async () => {
    const res = await myFetch.post(`/competitions/${contest.competitionId}/open-round/${round.roundId}`, {});

    if (res.success) updateRound(res.data);
  };

  const submitMockResult = async () => {
    let firstUnusedPersonId =
      persons.length === 0
        ? 1
        : persons.reduce((acc: PersonResponse, person: PersonResponse) => (!acc || person.id > acc.id ? person : acc))
            .id + 1;
    const resultPersons: PersonResponse[] = [];
    for (let i = 0; i < currEvent.participants; i++) {
      while (resultPersons.length === i) {
        const res = await getPersonById({ id: firstUnusedPersonId });
        if (res.serverError || res.validationErrors) firstUnusedPersonId++;
        else resultPersons.push(res.data!);
      }
      firstUnusedPersonId++;
    }
    const newResultDto: ResultDto = {
      eventId,
      personIds: resultPersons.map((p) => p.id),
      attempts: new Array(round.cutoffNumberOfAttempts ?? roundFormat.attempts).fill({ result: -1 }),
      competitionId: contest.competitionId,
      roundId: round.id,
    };

    const res = await createResult({ newResultDto });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      addNewPersonsToList(resultPersons);
      resetSelectedPersonsAndAttempts();
      setResults(res.data!);
      // Assuming that the mock result couldn't have affected any records
    }
  };

  return (
    <div className="px-2">
      <ToastMessages />

      <div className="row py-4">
        <div className="col-lg-3 mb-4">
          <div>
            <EventButtons eventId={eventId} events={events} forPage="data-entry" />
            <FormSelect
              title="Round"
              options={roundOptions}
              selected={round.roundTypeId}
              setSelected={(val: RoundType) => updateRound(rounds.find((r) => r.roundTypeId === val)!)}
              disabled={resultUnderEdit !== null || isPending}
              className="mb-3"
            />
            <FormPersonInputs
              title="Competitor"
              personNames={personNames}
              setPersonNames={setPersonNames}
              onSelectPerson={onSelectPerson}
              persons={selectedPersons}
              setPersons={setSelectedPersons}
              nextFocusTargetId="attempt_1"
              addNewPersonMode="default"
              redirectToOnAddPerson={`${pathname}?eventId=${eventId}`}
              disabled={!round.open || isPending}
              display="basic"
            />
            {attempts.map((attempt: Attempt, i: number) => (
              <AttemptInput
                key={i}
                attNumber={i + 1}
                attempt={attempt}
                setAttempt={(val: Attempt) => changeAttempt(i, val)}
                event={currEvent}
                nextFocusTargetId={i + 1 === lastActiveAttempt ? "submit_attempt_button" : undefined}
                timeLimitCentiseconds={round.timeLimitCentiseconds}
                disabled={i + 1 > lastActiveAttempt || !round.open || isPending}
              />
            ))}
            {isPendingWrPairs ? (
              <Loading small dontCenter />
            ) : (
              <BestAndAverage
                event={currEvent}
                roundFormat={round.format}
                attempts={attempts}
                eventWrPair={eventWrPair}
                recordConfigs={recordConfigs}
                cutoffAttemptResult={round.cutoffAttemptResult}
                cutoffNumberOfAttempts={round.cutoffNumberOfAttempts}
              />
            )}
            <Button
              id="submit_attempt_button"
              onClick={submitResult}
              disabled={!round.open || isPending}
              isLoading={isCreating}
              className="d-block mt-3"
            >
              Submit
            </Button>
            {process.env.NODE_ENV !== "production" && (
              <Button
                onClick={submitMockResult}
                disabled={!round.open || isPending}
                isLoading={isCreating}
                className="btn-secondary mt-4"
              >
                Submit Mock Result
              </Button>
            )}
            {contest.queuePosition !== null && false && (
              <>
                <p className="mt-4 mb-2">Current position in queue:</p>
                <div className="d-flex gap-3 align-items-center">
                  <Button
                    onClick={() => updateQueuePosition("decrement")}
                    disabled={isPending}
                    className="btn-success btn-xs"
                    title="Decrement"
                    ariaLabel="Decrement queue position"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </Button>
                  <p className="fs-5 fw-bold mb-0">{queuePosition}</p>
                  <Button
                    onClick={() => updateQueuePosition("increment")}
                    disabled={isPending}
                    className="btn-success btn-xs"
                    title="Increment"
                    ariaLabel="Increment queue position"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </Button>
                  <Button onClick={() => updateQueuePosition("reset")} disabled={isPending} className="btn-xs">
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

          {round.open || results.some((r) => r.roundId === round.id) ? (
            <RoundResultsTable
              event={currEvent}
              round={round}
              results={results.filter((r) => r.roundId === round.id).sort((a, b) => a.ranking! - b.ranking!)}
              persons={persons}
              recordConfigs={recordConfigs}
              onEditResult={round.open ? editResult : undefined}
              onDeleteResult={round.open ? deleteResult : undefined}
              disableEditAndDelete={resultUnderEdit !== null}
              loadingId={loadingId}
            />
          ) : (
            <div className="mt-5">
              {isOpenableRound ? (
                <>
                  <Button onClick={openRound} className="d-block mx-auto">
                    Open Round
                  </Button>
                  <p className="fst-italic mt-4 text-center text-danger">
                    Do NOT begin this round before opening it using the button, which checks that the round may be
                    opened. Also, please mind that manually adding/removing competitors to/from a subsequent round
                    hasn't been implemented yet.
                  </p>
                </>
              ) : (
                <p className="fst-italic text-center">This round cannot be opened yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataEntryScreen;
