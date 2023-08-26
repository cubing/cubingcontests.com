'use client';

import { useState, useEffect, useMemo } from 'react';
import { ICompetitionEvent, ICompetitionData, IResult, IPerson, IRound } from '@sh/interfaces';
import RoundResultsTable from '@c/RoundResultsTable';
import myFetch from '~/helpers/myFetch';
import { CompetitionState } from '@sh/enums';
import { compareAvgs, compareSingles, setNewRecords } from '@sh/sharedFunctions';
import { roundFormats } from '~/helpers/roundFormats';
import { getRoundRanksWithAverage, formatTime, submitResult } from '~/helpers/utilityFunctions';
import ResultForm from './ResultForm';
import { IResultInfo } from '~/helpers/interfaces/ResultInfo';
import ErrorMessages from '../ErrorMessages';

const PostResultsScreen = ({
  compData: { competition, persons: prevPersons, activeRecordTypes, recordPairsByEvent },
}: {
  compData: ICompetitionData;
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

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

  useEffect(() => {
    if (competition.state < CompetitionState.Approved) {
      setErrorMessages(["This competition hasn't been approved yet. Submitting results is disabled."]);
    } else if (competition.state >= CompetitionState.Finished) {
      setErrorMessages(['This competition is over. Submitting results is disabled.']);
    }
  }, [competition]);

  // Focus the first competitor input whenever the round is changed
  useEffect(() => {
    document.getElementById('Competitor_1').focus();
  }, [round.roundId]);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  const handleSubmit = async () => {
    if ([CompetitionState.Approved, CompetitionState.Ongoing].includes(competition.state)) {
      setErrorMessages([]);
      setSuccessMessage('');

      const { errors } = await myFetch.patch(`/competitions/${competition.competitionId}?action=post_results`, {
        events: competitionEvents,
      });

      if (errors) {
        setErrorMessages(errors);
      } else {
        setSuccessMessage('Results successfully submitted');
      }
    } else {
      setErrorMessages(['Submitting results is disabled']);
    }
  };

  const handleSubmitResult = () => {
    submitResult(
      attempts,
      round.format,
      currEvent,
      currentPersons,
      setErrorMessages,
      setSuccessMessage,
      ({ parsedAttempts, best, average }: IResultInfo) => {
        const newRound = {
          ...round,
          results: [
            ...round.results,
            {
              competitionId: competition.competitionId,
              eventId: currEvent.eventId,
              date: round.date,
              compNotPublished: true,
              personIds: currentPersons.map((el) => el.personId),
              ranking: 0, // real rankings assigned below
              attempts: parsedAttempts,
              best,
              average,
            },
          ],
        };

        // Sort the results and set rankings correctly
        newRound.results = mapRankings(
          newRound.results.sort(roundFormats[newRound.format].isAverage ? compareAvgs : compareSingles),
        );

        updateRoundAndCompetitionEvents(newRound);
        setCurrentPersons(Array(currEvent.participants || 1).fill(null));
        setAttempts(Array(roundFormats[round.format].attempts).fill(''));
        // Add new persons to list of persons
        setPersons([...persons, ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId))]);
        document.getElementById('Competitor_1').focus();
      },
    );
  };

  const updateRoundAndCompetitionEvents = (newRound: IRound) => {
    const newCompetitionEvents = competitionEvents.map((ce) =>
      ce.event.eventId !== currEvent.eventId
        ? ce
        : {
            ...ce,
            rounds: setNewRecords(
              ce.rounds.map((r) => (r.roundTypeId !== newRound.roundTypeId ? r : newRound)),
              recordPairs,
            ),
          },
    );

    setCompetitionEvents(newCompetitionEvents);
    setRound(newRound);
  };

  const editResult = (result: IResult) => {
    // Delete result and then set the inputs if the deletion was successful
    deleteResult(result.personIds, () => {
      const newCurrentPersons = persons.filter((p) => result.personIds.includes(p.personId));
      setCurrentPersons(newCurrentPersons);

      const newAttempts = result.attempts.map((el) => formatTime(el, currEvent, { removeFormatting: true }));
      setAttempts(newAttempts);

      document.getElementById('attempt_1').focus();
    });
  };

  const deleteResult = (personIds: number[], editCallback?: () => void) => {
    const newRound: IRound = {
      ...round,
      // Checking by a single person ID from a team event result is enough
      results: mapRankings(round.results.filter((res) => !res.personIds.includes(personIds[0]))),
    };

    updateRoundAndCompetitionEvents(newRound);

    if (editCallback) editCallback();
  };

  // Assumes results are already sorted
  const mapRankings = (results: IResult[]): IResult[] => {
    if (results.length === 0) return results;

    const newResults: IResult[] = [];
    let prevResult = results[0];
    let ranking = 1;

    for (let i = 0; i < results.length; i++) {
      // If the previous result was not tied with this one, increase ranking
      if (!getRoundRanksWithAverage(round.format, currEvent)) {
        if (compareSingles(prevResult, results[i]) < 0) ranking = i + 1;
      } else {
        if (compareAvgs(prevResult, results[i]) < 0) ranking = i + 1;
      }

      newResults.push({ ...results[i], ranking });
      prevResult = results[i];
    }

    return newResults;
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
          />
          <div className="mt-3 d-flex justify-content-between">
            <button type="button" id="submit_attempt_button" onClick={handleSubmitResult} className="btn btn-success">
              Submit
            </button>
            <button type="button" onClick={handleSubmit} className="btn btn-primary">
              Submit Results
            </button>
          </div>
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
