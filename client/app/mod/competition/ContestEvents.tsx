"use client";

import { useMemo, useState } from "react";
import C from "~/shared_helpers/constants.ts";
import { ContestType, EventFormat, EventGroup, RoundFormat, RoundProceed, RoundType } from "~/shared_helpers/enums.ts";
import {
  type IContestEvent,
  type ICutoff,
  type IEvent,
  type IFeAttempt,
  type IProceed,
  type IRound,
  type ITimeLimit,
  type NumberInputValue,
} from "~/shared_helpers/types.ts";
import { cutoffAttemptsOptions, roundProceedOptions } from "~/helpers/multipleChoiceOptions.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import EventTitle from "~/app/components/EventTitle.tsx";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import Button from "~/app/components/UI/Button.tsx";
import FormEventSelect from "~/app/components/form/FormEventSelect.tsx";
import { getRoundFormatOptions, getTimeLimit } from "~/helpers/utilityFunctions.ts";
import { getTotalRounds } from "~/shared_helpers/sharedFunctions.ts";
import { roundFormats } from "~/shared_helpers/roundFormats.ts";

type Props = {
  events: IEvent[];
  contestEvents: IContestEvent[];
  setContestEvents: (val: IContestEvent[]) => void;
  contestType: ContestType;
  disabled: boolean;
  disableNewEvents: boolean;
};

const ContestEvents = ({
  events,
  contestEvents,
  setContestEvents,
  contestType,
  disabled,
  disableNewEvents,
}: Props) => {
  const [newEventId, setNewEventId] = useState(events[0].eventId);

  const totalRounds: number = useMemo(() => getTotalRounds(contestEvents), [contestEvents]);
  const totalResultsPerContestEvent: number[] = useMemo(
    () => contestEvents.map((ce) => ce.rounds.map((r) => r.results.length).reduce((prev, curr) => curr + prev)),
    [contestEvents],
  );

  const disableNewRounds = disabled || (contestType === ContestType.Meetup && totalRounds >= 15);
  const filteredEvents: IEvent[] = events.filter((ev) =>
    contestType !== ContestType.WcaComp || !ev.groups.includes(EventGroup.WCA)
  );
  const remainingEvents: IEvent[] = filteredEvents.filter((ev) =>
    !contestEvents.some((ce) => ce.event.eventId === ev.eventId)
  );
  // Fix new event ID, if it's not in the list of remaining events
  if (!remainingEvents.some((e) => e.eventId === newEventId)) setNewEventId(remainingEvents[0].eventId);
  // Also disable new events if new rounds are disabled or if there are no more events to add
  disableNewEvents = disabled || disableNewEvents || disableNewRounds || contestEvents.length === filteredEvents.length;

  const getNewRound = (event: IEvent, roundNumber: number): IRound => {
    return {
      roundId: `${event.eventId}-r${roundNumber}`,
      competitionId: "TEMPORARY", // this gets replaced for all rounds on submit
      roundTypeId: RoundType.Final,
      format: (events.find((el) => el.eventId === event.eventId) as IEvent).defaultRoundFormat,
      timeLimit: getTimeLimit(event.format),
      results: [],
    };
  };

  const addContestEvent = () => {
    const event = events.find((e) => e.eventId === newEventId) as IEvent;

    setContestEvents(
      [...contestEvents, { event, rounds: [getNewRound(event, 1)] }].sort((a: IContestEvent, b: IContestEvent) =>
        a.event.rank - b.event.rank
      ),
    );

    if (remainingEvents.length > 1) {
      const newId = (remainingEvents.find((event) => event.eventId !== newEventId) as IEvent).eventId;
      setNewEventId(newId);
    }
  };

  const deleteContestEvent = (eventId: string) => {
    setContestEvents(contestEvents.filter((ce) => ce.event.eventId !== eventId));
  };

  const addRound = (eventId: string) => {
    const contestEvent = contestEvents.find((el) => el.event.eventId === eventId) as IContestEvent;

    // Update the currently semi-final round
    if (contestEvent.rounds.length > 2) {
      const semiRound = contestEvent.rounds[contestEvent.rounds.length - 2];
      semiRound.roundTypeId = Object.values(RoundType)[contestEvent.rounds.length - 2];
    }

    // Update the currently last round
    const lastRound = contestEvent.rounds[contestEvent.rounds.length - 1];
    lastRound.proceed = { type: RoundProceed.Percentage, value: 50 };
    lastRound.roundTypeId = contestEvent.rounds.length > 1 ? RoundType.Semi : RoundType.First;

    // Add new round
    contestEvent.rounds.push(getNewRound(contestEvent.event, contestEvent.rounds.length + 1));

    setContestEvents(contestEvents.map((ce) => (ce.event.eventId === eventId ? contestEvent : ce)));
  };

  const deleteRound = (eventId: string) => {
    const contestEvent = contestEvents.find((el) => el.event.eventId === eventId) as IContestEvent;
    const wasOpenRound = (contestEvent.rounds.at(-1) as IRound).open;
    contestEvent.rounds = contestEvent.rounds.slice(0, -1);

    // Update new final round
    const newLastRound = contestEvent.rounds.at(-1) as IRound;
    delete newLastRound.proceed;
    newLastRound.roundTypeId = RoundType.Final;
    if (wasOpenRound) newLastRound.open = true;

    // Update new semi final round
    if (contestEvent.rounds.length > 2) {
      const newSemiRound = contestEvent.rounds[contestEvent.rounds.length - 2];
      newSemiRound.roundTypeId = RoundType.Semi;
    }

    setContestEvents(contestEvents.map((ce) => (ce.event.eventId === eventId ? contestEvent : ce)));
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
      }
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimit = (eventIndex: number, roundIndex: number, value: IFeAttempt) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) =>
          i !== roundIndex
            ? round
            : { ...round, timeLimit: { ...round.timeLimit, centiseconds: value.result } as ITimeLimit }
        ),
      }
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimitCumulative = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) =>
          i !== roundIndex ? round : {
            ...round,
            timeLimit: {
              ...round.timeLimit as ITimeLimit,
              cumulativeRoundIds: (round.timeLimit as ITimeLimit).cumulativeRoundIds.length > 0 ? [] : [round.roundId],
            },
          }
        ),
      }
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundCutoffEnabled = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) =>
          i !== roundIndex ? round : {
            ...round,
            cutoff: round.cutoff ? undefined : {
              attemptResult: 12000,
              numberOfAttempts: round.format === RoundFormat.Average ? 2 : 1,
            },
          }
        ),
      }
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundCutoff = (eventIndex: number, roundIndex: number, value: IFeAttempt) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : {
          ...round,
          cutoff: { ...round.cutoff, attemptResult: value.result } as ICutoff,
        })),
      }
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundCutoffNumberOfAttempts = (eventIndex: number, roundIndex: number, value: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : {
          ...round,
          cutoff: { ...round.cutoff as ICutoff, numberOfAttempts: value },
        })),
      }
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundProceed = (
    eventIndex: number,
    roundIndex: number,
    type: RoundProceed,
    newVal?: NumberInputValue,
  ) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex ? ce : {
        ...ce,
        rounds: ce.rounds.map((round, i) =>
          i !== roundIndex ? round : {
            ...round,
            proceed: { type, value: newVal === undefined ? (round.proceed as IProceed).value : newVal } as IProceed,
          }
        ),
      }
    );

    setContestEvents(newContestEvents);
  };

  return (
    <section>
      <p className="mb-3 fs-6 text-danger fst-italic">
        Make sure{" "}
        <a href="https://www.worldcubeassociation.org/regulations/full/#9m" target="_blank">WCA Regulation 9m</a>{" "}
        is followed, when opening subsequent rounds. Not having enough competitors will make you unable to open up the
        next round. In such cases all subsequent rounds are to be cancelled and removed.
      </p>

      <p className="mb-4">Total events: {contestEvents.length} | Total rounds: {totalRounds}</p>

      <div className="mb-4 d-flex align-items-center gap-3">
        <Button onClick={addContestEvent} disabled={disableNewEvents} className="btn-success">Add Event</Button>
        <div className="flex-grow-1">
          <FormEventSelect
            title=""
            noMargin
            events={remainingEvents}
            eventId={newEventId}
            setEventId={setNewEventId}
            disabled={disableNewEvents}
          />
        </div>
      </div>
      {contestEvents.map((ce, eventIndex) => (
        <div key={ce.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <EventTitle event={ce.event} fontSize="4" noMargin showIcon showDescription linkToRankings />

            {totalResultsPerContestEvent[eventIndex] > 0
              ? <p className="mb-0">Total results: {totalResultsPerContestEvent[eventIndex]}</p>
              : (
                <Button
                  className="btn-danger btn-sm"
                  onClick={() => deleteContestEvent(ce.event.eventId)}
                >
                  Remove Event
                </Button>
              )}
          </div>
          {ce.rounds.map((round, roundIndex) => (
            <div key={round.roundId} className="mb-3 py-3 px-3 px-md-4 border rounded bg-body-secondary">
              <div className="flex-grow-1 d-flex align-items-center gap-3 gap-md-5">
                <h5 className="m-0">{roundTypes[round.roundTypeId].label}</h5>

                <div className="flex-grow-1">
                  <FormSelect
                    title=""
                    options={getRoundFormatOptions(roundFormats)}
                    selected={round.format}
                    setSelected={(val: string) =>
                      changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                    disabled={round.results.length > 0}
                  />
                </div>
              </div>
              {ce.event.format === EventFormat.Time && (
                <div className="d-flex flex-wrap align-items-center gap-3 gap-md-5 w-100 mt-3">
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <h6 className="flex-shrink-0 m-0">Time limit:</h6>

                    <div style={{ maxWidth: "8rem" }}>
                      <AttemptInput
                        attNumber={0}
                        attempt={{ result: round.timeLimit ? round.timeLimit.centiseconds : 0 }}
                        setAttempt={(val) =>
                          changeRoundTimeLimit(eventIndex, roundIndex, val)}
                        event={ce.event}
                        maxTime={C.maxTimeLimit}
                        disabled={round.results.length > 0}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <h6 className="flex-shrink-0 m-0">Cumulative limit:</h6>

                    <FormCheckbox
                      title=""
                      id={`cumulative_limit_${ce.event.eventId}_${roundIndex + 1}`}
                      selected={(round.timeLimit as ITimeLimit).cumulativeRoundIds.length > 0}
                      setSelected={() => changeRoundTimeLimitCumulative(eventIndex, roundIndex)}
                      disabled={round.results.length > 0}
                      noMargin
                    />
                  </div>
                </div>
              )}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 gap-md-5 mt-3">
                <h6 className="flex-shrink-0 m-0">Cutoff:</h6>

                <FormCheckbox
                  title="Enabled"
                  id={`cutoff_${ce.event.eventId}_${roundIndex + 1}`}
                  selected={round.cutoff !== undefined}
                  setSelected={() =>
                    changeRoundCutoffEnabled(eventIndex, roundIndex)}
                  disabled={round.results.length > 0}
                  noMargin
                  small
                />

                <div style={{ maxWidth: "8rem" }}>
                  <AttemptInput
                    attNumber={0}
                    attempt={{ result: round.cutoff ? round.cutoff.attemptResult : 0 }}
                    setAttempt={(val: IFeAttempt) => changeRoundCutoff(eventIndex, roundIndex, val)}
                    event={ce.event}
                    maxTime={C.maxTimeLimit}
                    disabled={!round.cutoff || round.results.length > 0}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center gap-3">
                  <h6 className="m-0">Attempts:</h6>

                  <FormSelect
                    title=""
                    options={cutoffAttemptsOptions}
                    selected={round.cutoff?.numberOfAttempts || 2}
                    setSelected={(val: number) => changeRoundCutoffNumberOfAttempts(eventIndex, roundIndex, val)}
                    disabled={!round.cutoff || round.results.length > 0}
                  />
                </div>
              </div>
              {round.proceed && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                  <FormRadio
                    id={`${round.roundId}_proceed_type`}
                    title="Proceed to next round:"
                    options={roundProceedOptions}
                    selected={round.proceed.type}
                    setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                    oneLine
                    small
                  />
                  <div style={{ width: "5rem" }}>
                    <FormNumberInput
                      id="round_proceed_value"
                      value={round.proceed.value}
                      setValue={(val) =>
                        changeRoundProceed(eventIndex, roundIndex, (round.proceed as IProceed).type, val)}
                      integer
                      min={round.proceed.type === RoundProceed.Percentage ? 1 : C.minProceedNumber}
                      max={round.proceed.type === RoundProceed.Percentage ? C.maxProceedPercentage : Infinity}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="d-flex gap-3">
            {ce.rounds.length < 10 && (
              <Button
                onClick={() => addRound(ce.event.eventId)}
                disabled={disableNewRounds}
                className="btn-success btn-sm"
              >
                {`Add Round ${ce.rounds.length + 1}`}
              </Button>
            )}
            {ce.rounds.length > 1 && (
              <Button
                onClick={() => deleteRound(ce.event.eventId)}
                disabled={(ce.rounds.at(-1) as IRound).results.length > 0}
                className="btn-danger btn-sm"
              >
                Remove Round
              </Button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ContestEvents;
