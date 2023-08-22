'use client';

import { useState, useEffect, useMemo } from 'react';
import FormEventSelect from '@c/form/FormEventSelect';
import { ICompetitionEvent, ICompetitionModData, IResult, IPerson, IRound, IRecordType } from '@sh/interfaces';
import RoundResultsTable from '@c/RoundResultsTable';
import FormTextInput from '../form/FormTextInput';
import myFetch from '~/helpers/myFetch';
import { RoundFormat, RoundType, EventFormat, WcaRecordType, CompetitionState } from '@sh/enums';
import { compareAvgs, compareSingles, setNewRecords } from '@sh/sharedFunctions';
import { roundFormats } from '~/helpers/roundFormats';
import {
  getBestAverageAndAttempts,
  getRoundRanksWithAverage,
  selectPerson,
  formatTime,
  getRoundCanHaveAverage,
} from '~/helpers/utilityFunctions';
import { roundTypes } from '~/helpers/roundTypes';

const PostResultsScreen = ({
  compData: { competition, persons: prevPersons, records },
  activeRecordTypes,
}: {
  compData: ICompetitionModData;
  activeRecordTypes: IRecordType[];
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>([]);
  const [personSelection, setPersonSelection] = useState(0);

  const [round, setRound] = useState<IRound>(competition.events[0].rounds[0]);
  const [personNames, setPersonNames] = useState(['']);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([null]);
  const [attempts, setAttempts] = useState<string[]>([]);
  const [persons, setPersons] = useState<IPerson[]>(prevPersons);
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>(competition.events);
  const [tempBest, setTempBest] = useState('');
  const [tempAverage, setTempAverage] = useState('');

  const currEventId = useMemo(() => round.roundId.split('-')[0], [round.roundId]);
  const currCompEvent = useMemo(
    () => competitionEvents.find((el) => el.event.eventId === currEventId),
    [currEventId, round.results.length, competitionEvents],
  );

  const logDebug = () => {
    console.log('Round:', round);
    console.log('Person names:', personNames);
    console.log('Current persons:', currentPersons);
    console.log('All persons', persons);
    console.log('Attempts:', attempts);
    console.log('Competition events', competitionEvents);
  };

  useEffect(logDebug, [competitionEvents]);

  // Initialize
  useEffect(() => {
    console.log('Competition:', competition);
    console.log('Records:', records);
    console.log('Active record types:', activeRecordTypes);

    resetAttempts(competition.events[0].rounds[0].format);

    if (competition.state < CompetitionState.Approved) {
      setErrorMessages(["This competition hasn't been approved yet. Submitting results is disabled."]);
    } else if (competition.state >= CompetitionState.Finished) {
      setErrorMessages(['This competition is over. Submitting results is disabled.']);
    }
  }, [competition, records, activeRecordTypes]);

  useEffect(() => {
    // Focus the last name input
    document.getElementById(`name_${personNames.length}`)?.focus();
  }, [personNames.length]);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) {
      window.scrollTo(0, 0);
    }
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

  const handleSubmitAttempts = () => {
    // Check for errors first
    const tempErrorMessages: string[] = [];

    if (currentPersons.includes(null)) {
      tempErrorMessages.push('Invalid person(s)');
    }

    for (let i = 0; i < attempts.length; i++) {
      // If attempt is empty or if it has invalid characters (THE EXCEPTION FOR - IS TEMPORARY!)
      if (!attempts[i] || /[^0-9.:-]/.test(attempts[i]) || isNaN(Number(attempts[i]))) {
        tempErrorMessages.push(`Attempt ${i + 1} is invalid`);
      }
    }

    // Show errors, if any
    if (tempErrorMessages.length > 0) {
      logDebug();
      setErrorMessages(tempErrorMessages);
    } else {
      const [best, average, parsedAttempts] = getBestAverageAndAttempts(attempts, round, currCompEvent.event);

      const newRound = {
        ...round,
        results: [
          ...round.results,
          {
            competitionId: competition.competitionId,
            eventId: currEventId,
            date: round.date,
            compNotPublished: true,
            personId: currentPersons.map((el) => el.personId.toString()).join(';'),
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

      // Add new persons to list of persons
      setPersons([...persons, ...currentPersons.filter((cp) => !persons.some((p) => p.personId === cp.personId))]);
      setErrorMessages([]);
      setSuccessMessage('');
      resetPersons();
      resetAttempts(round.format);
      document.getElementById('name_1')?.focus();
    }
  };

  const updateRoundAndCompetitionEvents = (newRound: IRound) => {
    const updateEventRecords = (rounds: IRound[]): IRound[] => {
      // Check for new records
      for (const rt of activeRecordTypes) {
        // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (rt && rt.wcaEquivalent === WcaRecordType.WR) {
          rounds = setNewRecords(rounds, records[rounds[0].roundId.split('-')[0]][rt.wcaEquivalent], rt.label);
        }
      }

      return rounds;
    };

    const newCompetitionEvents = competitionEvents.map((ce) =>
      ce.event.eventId !== newRound.roundId.split('-')[0]
        ? ce
        : {
            ...ce,
            rounds: updateEventRecords(ce.rounds.map((r) => (r.roundTypeId !== newRound.roundTypeId ? r : newRound))),
          },
    );

    setCompetitionEvents(newCompetitionEvents);
    setRound(newRound);
  };

  const changeRoundAndEvent = (newRoundType: RoundType, newEvent = currEventId) => {
    const compEvent = competitionEvents.find((ce) => ce.event.eventId === newEvent);
    let newRound: IRound;

    if (newRoundType === null) newRound = compEvent.rounds[0];
    else newRound = compEvent.rounds.find((r) => r.roundTypeId === newRoundType);

    setRound(newRound);
    resetAttempts(newRound.format);
    resetPersons(newEvent);
  };

  const onPersonKeyDown = async (index: number, e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (matchedPersons.length === 0) {
        setErrorMessages(['Competitor not found']);
      } else {
        const newSelectedPerson = matchedPersons[personSelection];

        // Set the found competitor's name
        const newPersonNames = personNames.map((el, i) => (i !== index ? el : newSelectedPerson.name));
        setPersonNames(newPersonNames);

        if (currentPersons.some((el) => el?.personId === newSelectedPerson.personId)) {
          setErrorMessages(['That competitor has already been selected']);
        } else if (
          round.results.some((res: IResult) => res.personId.split(';').includes(newSelectedPerson.personId.toString()))
        ) {
          setErrorMessages(["That competitor's results have already been entered"]);
        }
        // If no errors, set the competitor object
        else {
          const newCurrentPersons = currentPersons.map((el, i) => (i !== index ? el : newSelectedPerson));

          // Focus on the next input, if all names have been entered, or the next competitor input,
          // if all names haven't been entered and the last competitor input is not currently focused
          if (!newCurrentPersons.includes(null)) {
            document.getElementById('solve_1')?.focus();
          } else if (index + 1 < currentPersons.length) {
            document.getElementById(`name_${index + 2}`)?.focus();
          }

          setCurrentPersons(newCurrentPersons);
          setErrorMessages([]);
          setMatchedPersons([]);
          setPersonSelection(0);
        }

        setSuccessMessage('');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (personSelection < matchedPersons.length - 1) {
        setPersonSelection(personSelection + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      setPersonSelection(Math.max(personSelection - 1, 0));
    }
  };

  const changePersonName = async (index: number, value: string) => {
    const newPersonNames = personNames.map((el, i) => (i !== index ? el : value));
    setPersonNames(newPersonNames);

    // Reset the person object for that person
    const newCurrentPersons = currentPersons.map((el, i) => (i !== index ? el : null));
    setCurrentPersons(newCurrentPersons);

    setErrorMessages([]);
    setSuccessMessage('');

    if (value) {
      // Search competitors that match the entered string
      const { payload, errors } = await myFetch.get(`/persons?searchParam=${value}`);

      setMatchedPersons([]);

      if (errors) {
        setErrorMessages(errors);
      } else if (payload.length > 0) {
        const newMatchedPersons = payload.slice(0, 10);

        setMatchedPersons(newMatchedPersons);

        // Update current person selection
        if (newMatchedPersons.length < personSelection) {
          setPersonSelection(0);
        }
      }
    } else {
      setMatchedPersons([]);
    }
  };

  const changeAttempt = (index: number, value: string) => {
    setAttempts(attempts.map((el, i) => (i !== index ? el : value)));
  };

  const resetPersons = (eventId = currEventId) => {
    const isTeamEvent =
      competition.events.find((el) => el.event.eventId === eventId).event.format === EventFormat.TeamTime;

    if (isTeamEvent) {
      setCurrentPersons([null, null]);
      setPersonNames(['', '']);
    } else {
      setCurrentPersons([null]);
      setPersonNames(['']);
    }

    setMatchedPersons([]);
    setPersonSelection(0);
  };

  const resetAttempts = (roundFormat: RoundFormat) => {
    const numberOfSolves = roundFormats[roundFormat].attempts;
    setAttempts(Array(numberOfSolves).fill(''));
    setTempBest('');
    setTempAverage('');
  };

  const updateTempBestAndAverage = (newAttempts = attempts) => {
    const [best, average] = getBestAverageAndAttempts(newAttempts, round, currCompEvent.event);

    setTempBest(formatTime(best, currCompEvent.event));
    if (getRoundCanHaveAverage(round, currCompEvent.event))
      setTempAverage(formatTime(average, currCompEvent.event, { isAverage: true }));
  };

  const editResult = (result: IResult) => {
    // Delete result and then set the inputs if the deletion was successful
    deleteResult(result.personId, () => {
      const newCurrentPersons = persons.filter((el) => result.personId.split(';').includes(el.personId.toString()));

      setPersonNames(newCurrentPersons.map((el) => el.name));
      setCurrentPersons(newCurrentPersons);

      const newAttempts = result.attempts.map((el) => formatTime(el, currCompEvent.event, { removeFormatting: true }));
      setAttempts(newAttempts);
      updateTempBestAndAverage(newAttempts);
    });
  };

  const deleteResult = (personId: string, editCallback?: () => void) => {
    const newRound: IRound = {
      ...round,
      results: mapRankings(round.results.filter((el) => el.personId !== personId)),
    };

    updateRoundAndCompetitionEvents(newRound);

    if (editCallback) editCallback();
  };

  // Takes results that are already sorted
  const mapRankings = (results: IResult[]): IResult[] => {
    if (results.length === 0) return results;

    const newResults: IResult[] = [];
    let prevResult = results[0];
    let ranking = 1;

    for (let i = 0; i < results.length; i++) {
      // If the previous result was not tied with this one, increase ranking
      if (!getRoundRanksWithAverage(round, currCompEvent.event)) {
        if (compareSingles(prevResult, results[i]) < 0) ranking = i + 1;
      } else {
        if (compareAvgs(prevResult, results[i]) < 0) ranking = i + 1;
      }

      newResults.push({ ...results[i], ranking });
      prevResult = results[i];
    }

    return newResults;
  };

  const enterAttempt = (e: any, index: number) => {
    if (e.key === 'Enter') {
      // Focus next time input or the submit button if it's the last input
      if (index + 1 < attempts.length) {
        document.getElementById(`solve_${index + 2}`)?.focus();
      } else {
        document.getElementById('submit_attempt_button')?.focus();
      }

      updateTempBestAndAverage();
    }
  };

  return (
    <>
      {errorMessages.map((message, index) => (
        <div key={index} className="mb-3 alert alert-danger fs-5" role="alert">
          {message}
        </div>
      ))}
      {errorMessages.length === 0 && successMessage && (
        <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}
      <div className="row my-4">
        <div className="col-3 pe-4">
          <FormEventSelect
            events={competition.events.map((el) => el.event)}
            eventId={currEventId}
            setEventId={(val) => changeRoundAndEvent(null, val)}
          />
          <div className="mb-3 fs-5">
            <label htmlFor="round" className="form-label">
              Round
            </label>
            <select
              id="round"
              className="form-select"
              value={round.roundTypeId}
              onChange={(e) => changeRoundAndEvent(e.target.value as RoundType)}
            >
              {currCompEvent.rounds.map((round: IRound) => (
                <option key={round.roundTypeId} value={round.roundTypeId}>
                  {roundTypes[round.roundTypeId].label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            {personNames.map((personName: string, i: number) => (
              <div key={i}>
                <FormTextInput
                  title={`Competitor ${i + 1}`}
                  id={`name_${i + 1}`}
                  value={personName}
                  setValue={(val: string) => changePersonName(i, val)}
                  onKeyDown={(e: any) => onPersonKeyDown(i, e)}
                />
                <ul className="position-absolute list-group">
                  {matchedPersons.map((person: IPerson, index) => (
                    <li
                      key={person.personId}
                      className={'list-group-item' + (index === personSelection ? ' active' : '')}
                      aria-current={index === personSelection}
                    >
                      {person.name}
                      {person.localizedName ? ` (${person.localizedName})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {attempts.map((attempt, i) => (
            <FormTextInput
              key={i}
              id={`solve_${i + 1}`}
              value={attempt}
              placeholder={`Attempt ${i + 1}`}
              setValue={(val: string) => changeAttempt(i, val)}
              onKeyDown={(e: any) => enterAttempt(e, i)}
            />
          ))}
          <p>
            Best: {tempBest}
            {tempAverage ? ` | Average: ${tempAverage}` : ''}
          </p>
          <div className="mt-3 d-flex justify-content-between">
            <button type="button" id="submit_attempt_button" onClick={handleSubmitAttempts} className="btn btn-success">
              Submit
            </button>
            <button type="button" onClick={handleSubmit} className="btn btn-primary">
              Submit Results
            </button>
          </div>
        </div>
        <div className="col-9">
          <h2 className="mb-4 text-center">
            {competition.events.length > 0 ? 'Edit' : 'Post'} results for&nbsp;
            {competition.name}
          </h2>
          {/* THIS STYLING IS A TEMPORARY SOLUTION!!! */}
          <div className="overflow-y-auto" style={{ maxHeight: '650px' }}>
            <RoundResultsTable
              round={round}
              event={currCompEvent.event}
              persons={persons}
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
