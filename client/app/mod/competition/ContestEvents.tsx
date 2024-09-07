'use client';

import { useMemo, useState } from 'react';
import C from '@sh/constants';
import { ContestType, EventFormat, EventGroup, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { IAttempt, IContestEvent, ICutoff, IEvent, IRound } from '@sh/types';
import { cutoffAttemptsOptions, roundFormatOptions, roundProceedOptions } from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';
import EventTitle from '@c/EventTitle';
import AttemptInput from '@c/AttemptInput';
import FormCheckbox from '@c/form/FormCheckbox';
import FormNumberInput from '@c/form/FormNumberInput';
import FormRadio from '@c/form/FormRadio';
import FormSelect from '@c/form/FormSelect';
import Button from '@c/UI/Button';
import FormEventSelect from '@c/form/FormEventSelect';
import { getTimeLimit } from '~/helpers/utilityFunctions';

const ContestEvents = ({
  events,
  contestEvents,
  setContestEvents,
  removeContestEvent,
  removeEventRound,
  contestType,
  disableNewEvents,
}: {
  events: IEvent[];
  contestEvents: IContestEvent[];
  setContestEvents: (val: IContestEvent[]) => void;
  removeContestEvent: (eventId: string) => void;
  removeEventRound: (eventId: string) => void;
  contestType: ContestType;
  disableNewEvents: boolean;
}) => {
  const [newEventId, setNewEventId] = useState(events[0].eventId);

  const totalRounds: number = useMemo(
    () => contestEvents.map((ce) => ce.rounds.length).reduce((prev, curr) => prev + curr, 0),
    [contestEvents],
  );
  const totalResultsPerContestEvent: number[] = useMemo(
    () => contestEvents.map((ce) => ce.rounds.map((r) => r.results.length).reduce((prev, curr) => curr + prev)),
    [contestEvents],
  );

  const filteredEvents = events.filter(
    (ev) => contestType !== ContestType.WcaComp || !ev.groups.includes(EventGroup.WCA),
  );
  const remainingEvents = filteredEvents.filter((ev) => !contestEvents.some((ce) => ce.event.eventId === ev.eventId));
  // Fix new event ID, if it's not in the list of remaining events
  if (!remainingEvents.some((e) => e.eventId === newEventId)) setNewEventId(remainingEvents[0].eventId);

  const getNewRound = (event: IEvent, roundNumber: number): IRound => {
    return {
      roundId: `${event.eventId}-r${roundNumber}`,
      competitionId: 'TEMPORARY', // this gets replaced for all rounds on submit
      roundTypeId: RoundType.Final,
      format: events.find((el) => el.eventId === event.eventId).defaultRoundFormat,
      timeLimit: getTimeLimit(event.format),
      results: [],
    };
  };

  const addContestEvent = () => {
    const event = events.find((el) => el.eventId === newEventId);

    setContestEvents(
      [...contestEvents, { event, rounds: [getNewRound(event, 1)] }].sort(
        (a: IContestEvent, b: IContestEvent) => a.event.rank - b.event.rank,
      ),
    );

    if (remainingEvents.length > 1) {
      const newId = remainingEvents.find((event) => event.eventId !== newEventId)?.eventId;
      setNewEventId(newId);
    }
  };

  const addRound = (eventId: string) => {
    const contestEvent = contestEvents.find((el) => el.event.eventId === eventId);

    // Update the currently semi-final round
    if (contestEvent.rounds.length > 2) {
      const semiRound = contestEvent.rounds[contestEvent.rounds.length - 2];
      semiRound.roundTypeId = Object.values(RoundType)[contestEvent.rounds.length - 2];
    }

    // Update the currently last round
    const lastRound = contestEvent.rounds[contestEvent.rounds.length - 1];
    lastRound.proceed = {
      type: RoundProceed.Percentage,
      value: 50,
    };
    lastRound.roundTypeId = contestEvent.rounds.length > 1 ? RoundType.Semi : RoundType.First;

    // Add new round
    contestEvent.rounds.push(getNewRound(contestEvent.event, contestEvent.rounds.length + 1));

    setContestEvents(contestEvents.map((el) => (el.event.eventId === eventId ? contestEvent : el)));
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimit = (eventIndex: number, roundIndex: number, value: IAttempt) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    timeLimit: { ...round.timeLimit, centiseconds: value.result },
                  },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimitCumulative = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    timeLimit: {
                      ...round.timeLimit,
                      cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.length > 0 ? [] : [round.roundId],
                    },
                  },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundCutoffEnabled = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    cutoff: round.cutoff
                      ? undefined
                      : { attemptResult: 12000, numberOfAttempts: round.format === RoundFormat.Average ? 2 : 1 },
                  },
            ),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundCutoff = (eventIndex: number, roundIndex: number, value: ICutoff) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, cutoff: value })),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, newVal?: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : { ...round, proceed: { type, value: newVal === undefined ? round.proceed.value : newVal } },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  return (
    <section>
      <p className="my-4">
        Total events: {contestEvents.length} | Total rounds: {totalRounds}
      </p>
      <div className="my-4 d-flex align-items-center gap-3">
        <Button
          text="Add Event"
          onClick={addContestEvent}
          disabled={disableNewEvents || contestEvents.length === filteredEvents.length}
          className="btn btn-success"
        />
        <div className="flex-grow-1">
          <FormEventSelect
            title=""
            noMargin
            events={remainingEvents}
            eventId={newEventId}
            setEventId={setNewEventId}
            disabled={disableNewEvents || contestEvents.length === filteredEvents.length}
          />
        </div>
      </div>
      {contestEvents.map((ce, eventIndex) => (
        <div key={ce.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <EventTitle event={ce.event} fontSize="4" noMargin showIcon showDescription />

            {totalResultsPerContestEvent[eventIndex] > 0 ? (
              <p className="mb-0">Total results: {totalResultsPerContestEvent[eventIndex]}</p>
            ) : (
              <Button
                text="Remove event"
                className="btn-danger btn-sm"
                onClick={() => removeContestEvent(ce.event.eventId)}
              />
            )}
          </div>
          {ce.rounds.map((round, roundIndex) => (
            <div key={round.roundId} className="mb-3 py-3 px-3 px-md-4 border rounded bg-body-secondary">
              <div className="flex-grow-1 d-flex align-items-center gap-3 gap-md-5">
                <h5 className="m-0">{roundTypes[round.roundTypeId].label}</h5>

                <div className="flex-grow-1">
                  <FormSelect
                    title=""
                    options={roundFormatOptions}
                    selected={round.format}
                    setSelected={(val: string) => changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                    disabled={round.results.length > 0}
                    noMargin
                  />
                </div>
              </div>
              {ce.event.format === EventFormat.Time && (
                <div className="d-flex flex-wrap align-items-center gap-3 gap-md-5 w-100 mt-3">
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <h6 className="flex-shrink-0 m-0">Time limit:</h6>

                    <div style={{ maxWidth: '8rem' }}>
                      <AttemptInput
                        attNumber={0}
                        attempt={{ result: round.timeLimit.centiseconds }}
                        setAttempt={(val) => changeRoundTimeLimit(eventIndex, roundIndex, val)}
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
                      selected={round.timeLimit.cumulativeRoundIds.length > 0}
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
                  setSelected={() => changeRoundCutoffEnabled(eventIndex, roundIndex)}
                  disabled={round.results.length > 0}
                  noMargin
                  small
                />

                <div style={{ maxWidth: '8rem' }}>
                  <AttemptInput
                    attNumber={0}
                    attempt={{
                      result: round.cutoff?.attemptResult === undefined ? 0 : round.cutoff.attemptResult,
                    }}
                    setAttempt={(val: IAttempt) =>
                      changeRoundCutoff(eventIndex, roundIndex, { ...round.cutoff, attemptResult: val.result })
                    }
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
                    setSelected={(val: number) =>
                      changeRoundCutoff(eventIndex, roundIndex, { ...round.cutoff, numberOfAttempts: val })
                    }
                    disabled={!round.cutoff || round.results.length > 0}
                    noMargin
                  />
                </div>
              </div>
              {round.roundTypeId !== RoundType.Final && (
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
                  <div style={{ width: '5rem' }}>
                    <FormNumberInput
                      id="round_proceed_value"
                      value={round.proceed.value}
                      setValue={(val) => changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)}
                      integer
                      min={round.proceed.type === RoundProceed.Percentage ? 1 : 2}
                      max={round.proceed.type === RoundProceed.Percentage ? C.maxProceedPercentage : Infinity}
                      noMargin
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="d-flex gap-3">
            {ce.rounds.length < 10 && (
              <Button
                text={`Add Round ${ce.rounds.length + 1}`}
                className="btn-success btn-sm"
                onClick={() => addRound(ce.event.eventId)}
              />
            )}
            {ce.rounds.length > 1 && (
              <Button
                text="Remove Round"
                onClick={() => removeEventRound(ce.event.eventId)}
                disabled={ce.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0}
                className="btn-danger btn-sm"
              />
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ContestEvents;
