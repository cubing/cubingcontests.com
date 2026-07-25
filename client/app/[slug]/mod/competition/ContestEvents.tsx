"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import EventImportantInfo from "~/app/[slug]/mod/competition/EventImportantInfo.tsx";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormEventSelect from "~/app/components/form/FormEventSelect.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { C } from "~/helpers/constants.ts";
import { cutoffAttemptsOptions, roundProceedOptions } from "~/helpers/multipleChoiceOptions.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { type ContestType, type RoundFormat, type RoundProceed, RoundTypeValues } from "~/helpers/types.ts";
import { getRoundFormatOptions } from "~/helpers/utility-functions.ts";
import type { RoundDto } from "~/helpers/validators/Round.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { Attempt } from "~/server/db/schema/results.ts";

const roundFormatOptions = getRoundFormatOptions(roundFormats);

type Props = {
  events: EventResponse[];
  rounds: RoundDto[];
  setRounds: (val: RoundDto[]) => void;
  totalResultsByRound: { roundId: number; totalResults: number }[] | undefined;
  competitionId: string;
  contestType: ContestType;
  disabled: boolean;
  newEventsDisabled: boolean;
  isAdmin: boolean;
};

function ContestEvents({
  events,
  rounds,
  setRounds,
  totalResultsByRound,
  competitionId,
  contestType,
  disabled,
  newEventsDisabled,
  isAdmin,
}: Props) {
  const { slug }: { slug: string } = useParams();

  const newRoundsDisabled = disabled || (contestType === "meetup" && rounds.length >= 15);
  const filteredEvents: EventResponse[] = events.filter(
    (e) => e.category !== "removed" && (!e.hidden || isAdmin) && (contestType !== "wca-comp" || e.category !== "wca"),
  );
  const contestEvents: { event: EventResponse; rounds: RoundDto[]; totalResults: number }[] = [];
  for (const round of [...rounds].sort((a, b) => a.roundNumber - b.roundNumber)) {
    const contestEvent = contestEvents.find((ce) => ce.event.eventId === round.eventId);
    const totalRoundResults = totalResultsByRound?.find((el) => el.roundId === round.id)?.totalResults ?? 0;

    if (contestEvent) {
      contestEvent.rounds.push(round);
      contestEvent.totalResults += totalRoundResults;
    } else {
      contestEvents.push({
        event: events.find((e) => e.eventId === round.eventId)!,
        rounds: [round],
        totalResults: totalRoundResults,
      });
    }
  }
  contestEvents.sort((a, b) => a.event.rank - b.event.rank);
  const remainingEvents: EventResponse[] = filteredEvents.filter(
    (e) => !contestEvents.some((ce) => ce.event.eventId === e.eventId),
  );

  // Disable new events if new rounds are disabled or if there are no more events to add
  newEventsDisabled = disabled || newEventsDisabled || newRoundsDisabled || remainingEvents.length === 0;

  const [newEventId, setNewEventId] = useState(remainingEvents[0]?.eventId ?? undefined);

  const newEvent = events.find((e) => e.eventId === newEventId)!;

  const getNewRound = (event: EventResponse, roundNumber: number): RoundDto => ({
    competitionId,
    eventId: event.eventId,
    roundNumber,
    roundTypeId: "f",
    format: events.find((e) => e.eventId === event.eventId)!.defaultRoundFormat,
    timeLimitCentiseconds: ["time", "time-3d"].includes(event.format) ? C.defaultTimeLimit : null,
    timeLimitCumulativeRoundIds: null,
    cutoffAttemptResult: null,
    cutoffNumberOfAttempts: null,
    proceedType: null,
    proceedValue: null,
  });

  const addContestEvent = () => {
    setRounds([...rounds, getNewRound(newEvent, 1)].sort((a, b) => a.roundNumber - b.roundNumber));

    if (remainingEvents.length > 1) {
      const newId = remainingEvents.find((e) => e.eventId !== newEventId)!.eventId;
      setNewEventId(newId);
    }
  };

  const deleteContestEvent = (eventId: string) => {
    setRounds(rounds.filter((r) => r.eventId !== eventId));
  };

  const addRound = (eventId: string) => {
    const contestEvent = contestEvents.find((ce) => ce.event.eventId === eventId)!;

    // Update the currently semi-final round
    if (contestEvent.rounds.length > 2)
      contestEvent.rounds.at(-2)!.roundTypeId = RoundTypeValues[contestEvent.rounds.length - 2];

    // Update the currently last round
    const lastRound = contestEvent.rounds.at(-1)!;
    lastRound.roundTypeId = contestEvent.rounds.length >= 2 ? "s" : "1";
    lastRound.proceedType = "percentage";
    lastRound.proceedValue = 50;

    setRounds([...rounds, getNewRound(contestEvent.event, contestEvent.rounds.length + 1)]);
  };

  const deleteRound = (eventId: string) => {
    const contestEvent = contestEvents.find((ce) => ce.event.eventId === eventId)!;
    const wasOpenRound = contestEvent.rounds.at(-1)!.open;
    const removedRound = contestEvent.rounds.pop()!;

    // Update new final round
    const newLastRound = contestEvent.rounds.at(-1)!;
    newLastRound.roundTypeId = "f";
    newLastRound.proceedType = null;
    newLastRound.proceedValue = null;
    if (wasOpenRound) newLastRound.open = true;

    // Update new semi final round
    if (contestEvent.rounds.length >= 3) contestEvent.rounds.at(-2)!.roundTypeId = "s";

    setRounds(
      rounds.filter((r) => !(r.eventId === removedRound.eventId && r.roundNumber === removedRound.roundNumber)),
    );
  };

  const changeRoundFormat = (eventId: string, roundNumber: number, value: RoundFormat) => {
    setRounds(
      rounds.map((r) => (r.eventId === eventId && r.roundNumber === roundNumber ? { ...r, format: value } : r)),
    );
  };

  const changeRoundTimeLimit = (eventId: string, roundNumber: number, value: Attempt) => {
    setRounds(
      rounds.map((r) =>
        r.eventId === eventId && r.roundNumber === roundNumber ? { ...r, timeLimitCentiseconds: value.result } : r,
      ),
    );
  };

  const changeRoundTimeLimitCumulative = (eventId: string, roundNumber: number) => {
    setRounds(
      rounds.map((r) =>
        r.eventId === eventId && r.roundNumber === roundNumber
          ? {
              ...r,
              timeLimitCumulativeRoundIds: r.timeLimitCumulativeRoundIds ? null : [],
            }
          : r,
      ),
    );
  };

  const changeRoundCutoffEnabled = (eventId: string, roundNumber: number) => {
    setRounds(
      rounds.map((r) => {
        const roundFormat = roundFormats.find((rf) => rf.value === r.format)!;
        return r.eventId === eventId && r.roundNumber === roundNumber
          ? {
              ...r,
              cutoffAttemptResult: r.cutoffAttemptResult === null ? 0 : null,
              cutoffNumberOfAttempts: r.cutoffNumberOfAttempts === null ? (roundFormat.attempts > 3 ? 2 : 1) : null,
            }
          : r;
      }),
    );
  };

  const changeRoundCutoff = (eventId: string, roundNumber: number, value: Attempt) => {
    setRounds(
      rounds.map((r) =>
        r.eventId === eventId && r.roundNumber === roundNumber
          ? {
              ...r,
              cutoffAttemptResult: value.result,
            }
          : r,
      ),
    );
  };

  const changeRoundCutoffNumberOfAttempts = (eventId: string, roundNumber: number, value: number) => {
    setRounds(
      rounds.map((r) =>
        r.eventId === eventId && r.roundNumber === roundNumber ? { ...r, cutoffNumberOfAttempts: value } : r,
      ),
    );
  };

  const changeRoundProceed = (
    round: RoundDto,
    { proceedType, proceedValue }: { proceedType: RoundProceed; proceedValue: number | undefined },
  ) => {
    setRounds(
      rounds.map((r) =>
        r.eventId === round.eventId && r.roundNumber === round.roundNumber
          ? // We want to allow proceedValue: undefined for when the user clears the input (this would be caught in the validator if submitted)
            { ...r, proceedType, proceedValue: proceedValue as any }
          : r,
      ),
    );
  };

  return (
    <section>
      <p className="mb-4">
        Total events: {contestEvents.length} | Total rounds: {rounds.length}
      </p>

      <div className="d-flex mb-4 flex-column gap-3">
        <div className="d-flex gap-3 align-items-center">
          <Button onClick={() => addContestEvent()} disabled={newEventsDisabled} className="btn-success">
            Add Event
          </Button>
          <div className="flex-grow-1">
            <FormEventSelect
              title=""
              noMargin
              events={remainingEvents}
              eventId={newEventId}
              setEventId={setNewEventId}
              disabled={newEventsDisabled}
            />
          </div>
        </div>
        {newEvent.description && <p className="fs-6 fst-italic mb-0">{newEvent.description}</p>}
        <EventImportantInfo importantInfo={newEvent.importantInfo} className="mb-0" />
      </div>

      {contestEvents.map((ce) => (
        <div key={ce.event.eventId} className="mb-3 rounded border bg-body-tertiary px-4 py-3">
          <div className="d-flex justify-content-between mb-3 flex-wrap gap-3 align-items-center">
            <EventTitle
              organizationSlug={slug}
              event={ce.event}
              fontSize="4"
              linkToRankings
              noMargin
              showDescription
              showIcon
            />

            {ce.totalResults > 0 ? (
              <p className="mb-0">Total results: {ce.totalResults}</p>
            ) : (
              <Button onClick={() => deleteContestEvent(ce.event.eventId)} className="btn-danger btn-sm">
                Remove Event
              </Button>
            )}
          </div>

          <EventImportantInfo importantInfo={ce.event.importantInfo} className="mb-3" />

          {ce.rounds.map((round) => {
            const totalRoundResults = totalResultsByRound?.find((el) => el.roundId === round.id)?.totalResults ?? 0;

            return (
              <div
                key={`${round.eventId}_r${round.roundNumber}`}
                className="mb-3 rounded border bg-body-secondary px-3 px-md-4 py-3"
              >
                <div className="d-flex flex-grow-1 gap-3 gap-md-5 align-items-center">
                  <h5 className="m-0">{roundTypes[round.roundTypeId].label}</h5>

                  <div className="flex-grow-1">
                    <FormSelect
                      title=""
                      options={roundFormatOptions}
                      selected={round.format}
                      setSelected={(val) => changeRoundFormat(round.eventId, round.roundNumber, val as any)}
                      disabled={totalRoundResults > 0}
                    />
                  </div>
                </div>
                {["time", "time-3d"].includes(ce.event.format) && (
                  <>
                    <div className="d-flex mt-3 w-100 flex-wrap gap-3 gap-md-5 align-items-center">
                      <div className="d-flex justify-content-between gap-3 align-items-center">
                        <h6 className="m-0 flex-shrink-0">Time limit:</h6>
                        <div style={{ maxWidth: "8rem" }}>
                          <AttemptInput
                            attNumber={0}
                            attempt={{ result: round.timeLimitCentiseconds ?? 0 }}
                            setAttempt={(val) => changeRoundTimeLimit(round.eventId, round.roundNumber, val)}
                            event={ce.event}
                            maxTime={C.maxTimeLimit}
                            disabled={totalRoundResults > 0}
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between gap-3 align-items-center">
                        <h6 className="m-0 flex-shrink-0">Cumulative limit:</h6>
                        <FormCheckbox
                          title=""
                          id={`cumulative_limit_${round.eventId}_r${round.roundNumber}`}
                          selected={!!round.timeLimitCumulativeRoundIds}
                          setSelected={() => changeRoundTimeLimitCumulative(round.eventId, round.roundNumber)}
                          disabled={totalRoundResults > 0}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between mt-3 flex-wrap gap-3 gap-md-5 align-items-center">
                      <h6 className="m-0 flex-shrink-0">Cutoff:</h6>

                      <FormCheckbox
                        title="Enabled"
                        id={`cutoff_${round.eventId}_${round.roundNumber}`}
                        selected={round.cutoffNumberOfAttempts !== null}
                        setSelected={() => changeRoundCutoffEnabled(round.eventId, round.roundNumber)}
                        disabled={totalRoundResults > 0}
                      />

                      <div style={{ maxWidth: "8rem" }}>
                        <AttemptInput
                          attNumber={0}
                          attempt={{ result: round.cutoffAttemptResult ?? 0 }}
                          setAttempt={(val: Attempt) => changeRoundCutoff(round.eventId, round.roundNumber, val)}
                          event={ce.event}
                          maxTime={C.maxTimeLimit}
                          disabled={round.cutoffAttemptResult === null || totalRoundResults > 0}
                        />
                      </div>

                      <div className="d-flex justify-content-between gap-3 align-items-center">
                        <h6 className="m-0">Attempts:</h6>

                        <FormSelect
                          title=""
                          options={cutoffAttemptsOptions}
                          selected={round.cutoffNumberOfAttempts ?? 2}
                          setSelected={(val) =>
                            changeRoundCutoffNumberOfAttempts(round.eventId, round.roundNumber, val as any)
                          }
                          disabled={!round.cutoffNumberOfAttempts || totalRoundResults > 0}
                        />
                      </div>
                    </div>
                  </>
                )}
                {round.proceedType && round.proceedValue !== null && (
                  <div className="d-flex justify-content-between mt-3 flex-wrap gap-3 align-items-center">
                    <FormRadio
                      id={`${round.eventId}_r${round.roundNumber}_proceed_type`}
                      title="Proceed to next round:"
                      options={roundProceedOptions}
                      selected={round.proceedType}
                      setSelected={(val) =>
                        changeRoundProceed(round, { proceedType: val, proceedValue: round.proceedValue! })
                      }
                      oneLine
                    />
                    <div style={{ width: "5rem" }}>
                      <FormNumberInput
                        id="round_proceed_value"
                        value={round.proceedValue}
                        setValue={(val) =>
                          changeRoundProceed(round, { proceedType: round.proceedType!, proceedValue: val })
                        }
                        integer
                        min={round.proceedType === "percentage" ? 1 : C.minProceedNumber}
                        max={round.proceedType === "percentage" ? C.maxProceedPercentage : Infinity}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="d-flex gap-3">
            {ce.rounds.length < C.maxRounds && (
              <Button
                onClick={() => addRound(ce.event.eventId)}
                disabled={newRoundsDisabled}
                className="btn-success btn-sm"
              >
                Add Round {ce.rounds.length + 1}
              </Button>
            )}
            {ce.rounds.length > 1 && (
              <Button
                onClick={() => deleteRound(ce.event.eventId)}
                // Disabled if last round has results
                disabled={!!totalResultsByRound?.find((el) => el.roundId === ce.rounds.at(-1)!.id)?.totalResults}
                className="btn-danger btn-sm"
              >
                Remove Round
              </Button>
            )}
          </div>

          {ce.rounds.length > 1 && (
            <p className="fs-6 fw-bold fst-italic mt-4 text-danger">
              Make sure{" "}
              <a href="https://www.worldcubeassociation.org/regulations/full/#9m" target="_blank" rel="noreferrer">
                Regulation 9m
              </a>{" "}
              is followed when opening subsequent rounds. Not having enough competitors will result in the subsequent
              round being cancelled.
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

export default ContestEvents;
