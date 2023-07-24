'use client';

import { useState, useEffect, useMemo } from 'react';
import FormEventSelect from '@c/form/FormEventSelect';
import { ICompetitionEvent, ICompetitionModData, IResult, IPerson, IRound, IRecordType } from '@sh/interfaces';
import RoundResultsTable from '@c/RoundResultsTable';
import FormTextInput from '../form/FormTextInput';
import myFetch from '~/helpers/myFetch';
import { RoundFormat, RoundType, EventFormat, WcaRecordType } from '@sh/enums';
import { compareAvgs, compareSingles, setNewRecords } from '@sh/sharedFunctions';
import { roundFormats } from '~/helpers/roundFormats';
import { selectPerson } from '~/helpers/utilityFunctions';

const PostResultsScreen = ({
  compData,
  activeRecordTypes,
}: {
  compData: ICompetitionModData;
  activeRecordTypes: IRecordType[];
}) => {
  const getDefaultRound = (eventId = '333', format = RoundFormat.Average): IRound => {
    return {
      competitionId: compData.competition.competitionId,
      eventId,
      date: compData.competition.startDate, // TO-DO: REMOVE HARD CODING TO START DATE!!!
      format: format,
      roundTypeId: RoundType.Final,
      results: [],
    };
  };

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [round, setRound] = useState<IRound>(getDefaultRound());
  const [roundNumber, setRoundNumber] = useState(1);
  const [personNames, setPersonNames] = useState(['']);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([null]);
  const [attempts, setAttempts] = useState(['', '', '', '', '']);
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);

  const currCompEvent = useMemo(
    () => competitionEvents.find((el) => el.eventId === round.eventId),
    [round.eventId, round.results.length, competitionEvents],
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
    console.log('Competition data:', compData);
    console.log('Active record types:', activeRecordTypes);

    setCompetitionEvents(compData.competition.events);
    setPersons(compData.persons);

    // Initialize 3x3x3 results, if they exist
    const round333: IRound = compData.competition.events.find((el) => el.eventId === '333')?.rounds[0];
    if (round333) setRound(round333);
  }, [compData, activeRecordTypes]);

  useEffect(() => {
    // Focus the last name input
    document.getElementById(`name_${personNames.length}`)?.focus();
  }, [personNames.length]);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) {
      window.scrollTo(0, 0);
    }
  }, [errorMessages]);

  const handleSubmit = async () => {
    if (competitionEvents.length === 0 && round.results.length === 0) {
      setErrorMessages(["You haven't entered any results"]);
      return;
    }

    setErrorMessages([]);
    setSuccessMessage('');

    const data = { events: competitionEvents };
    const { errors } = await myFetch.patch(`/competitions/${compData.competition.competitionId}`, data);

    if (errors) {
      setErrorMessages(errors);
    } else {
      setSuccessMessage('Results successfully submitted');
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
      const tempAttempts = attempts.map((el) => getResult(el));
      // If the attempt is 0, -1 or -2, then it's a special value that is always worse than other values (e.g. DNF)
      let best: number = Math.min(...tempAttempts.map((att) => (att > 0 ? att : Infinity)));
      if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS
      let average: number;

      if (
        tempAttempts.filter((el) => el <= 0).length > 1 ||
        (tempAttempts.filter((el) => el <= 0).length > 0 && tempAttempts.length === 3) ||
        tempAttempts.length < 3 ||
        round.eventId === '333mbf'
      ) {
        average = -1; // DNF
      } else {
        let sum = tempAttempts.reduce((prev: number, curr: number) => {
          // Ignore DNF, DNS, etc.
          if (curr <= 0) return prev;
          return curr + prev;
        }) as number;

        // Subtract best and worst results
        if (tempAttempts.length === 5) {
          sum -= best;
          // Only subtract worst if there is no DNF, DNS, etc.
          if (tempAttempts.find((el) => el <= 0) === undefined) sum -= Math.max(...tempAttempts);
        }

        average = Math.round((sum / 3) * (round.eventId === '333fm' ? 100 : 1));
      }

      const newRound = round;

      newRound.results.push({
        competitionId: compData.competition.competitionId,
        eventId: newRound.eventId,
        date: compData.competition.startDate,
        personId: currentPersons.map((el) => el.personId.toString()).join(';'),
        ranking: 0, // real rankings assigned below
        attempts: tempAttempts,
        best,
        average,
      });

      // Sort the results and set rankings correctly
      newRound.results = mapRankings(
        newRound.results.sort(roundFormats[newRound.format].isAverage ? compareAvgs : compareSingles),
      );

      updateCompetitionEvents(newRound);

      setRound(newRound);
      setPersons((prev) => [
        ...prev,
        ...currentPersons.filter((cp) => !persons.find((p) => p.personId === cp.personId)),
      ]);
      setErrorMessages([]);
      resetPersons();
      resetAttempts(round.format);
      document.getElementById('name_1')?.focus();
    }
  };

  const getResult = (time: string): number => {
    // If FMC or negative value, return as is, just converted to integer
    if (round.eventId === '333fm' || time.includes('-')) return parseInt(time);

    time = time.replace(':', '').replace('.', '');

    let minutes = 0;
    if (time.length > 4) {
      minutes = parseInt(time.slice(0, -4));
      time = time.slice(-4);
    }

    const centiseconds = parseInt(time) + minutes * 6000;
    return centiseconds;
  };

  const updateEventRecords = (rounds: IRound[]): IRound[] => {
    // Check for new records
    for (const rt of activeRecordTypes) {
      // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (rt && rt.wcaEquivalent === WcaRecordType.WR) {
        rounds = setNewRecords(rounds, compData.records[rounds[0].eventId][rt.wcaEquivalent], rt.label);
      }
    }

    return rounds;
  };

  const updateCompetitionEvents = (newRound: IRound) => {
    let newCompetitionEvents = competitionEvents;
    const compEvent = currCompEvent;

    // Add event if this is the first round for it
    if (!compEvent) {
      newCompetitionEvents.push({
        eventId: round.eventId,
        rounds: updateEventRecords([newRound]), // update records
      });
      // If this round hasn't been added yet, add it
    } else {
      // If newRound.results is empty, that means we are deleting a round
      if (newRound.results.length === 0) {
        compEvent.rounds = compEvent.rounds.filter((el) => el.roundTypeId !== newRound.roundTypeId);

        // If that was the only round for this event, delete the event. Otherwise, update records.
        if (compEvent.rounds.length === 0) {
          newCompetitionEvents = newCompetitionEvents.filter((el) => el.eventId !== compEvent.eventId);
        } else {
          // Update records
          compEvent.rounds = updateEventRecords(compEvent.rounds);
        }
      } else {
        if (roundNumber > compEvent.rounds.length) {
          compEvent.rounds.push(newRound);

          // Update previous round type if needed
          if (roundNumber === 2) compEvent.rounds[0].roundTypeId = RoundType.First;
          else if (roundNumber === 3) compEvent.rounds[1].roundTypeId = RoundType.Second;
          else if (roundNumber === 4) compEvent.rounds[2].roundTypeId = RoundType.Semi;
        }
        // If this round has already been added, update it
        else compEvent.rounds[roundNumber - 1] = newRound;

        // Update records
        compEvent.rounds = updateEventRecords(compEvent.rounds);
      }
    }

    setCompetitionEvents(newCompetitionEvents);
  };

  const changeRoundAndEvent = (newRoundNumber: number, newEvent = round.eventId) => {
    const compEvent = competitionEvents.find((el) => el.eventId === newEvent);

    if (newRoundNumber - 1 > (compEvent?.rounds.length || 0)) {
      setErrorMessages(['Results for all previous rounds must be entered first']);
      return;
    } else {
      setErrorMessages([]);
    }

    if (newRoundNumber !== roundNumber) setRoundNumber(newRoundNumber);

    // Check if the selected round has already been saved, and if so, load its results
    const savedRound = compEvent?.rounds[newRoundNumber - 1];
    const defaultRoundFormat = compData.events.find((ev) => ev.eventId === newEvent).defaultRoundFormat;

    if (savedRound) setRound(savedRound);
    // If it hasn't been saved, we are creating a new round. Set default values (a new round
    // will always be finals, unless it gets changed later)
    else setRound(getDefaultRound(newEvent, defaultRoundFormat));

    resetAttempts(defaultRoundFormat);
    resetPersons(newEvent);
  };

  const changeRoundFormat = (newFormat: RoundFormat) => {
    setRound({ ...round, format: newFormat });
    resetAttempts(newFormat);
  };

  const onSelectCompetitor = async (index: number, e: any) => {
    selectPerson(e, setErrorMessages, (person: IPerson) => {
      // Set the found competitor's name
      const newPersonNames = personNames.map((el, i) => (i !== index ? el : person.name));
      setPersonNames(newPersonNames);

      if (currentPersons.find((el) => el?.personId === person.personId)) {
        setErrorMessages(['That competitor has already been selected']);
      } else if (round.results.find((res: IResult) => res.personId.split(';').includes(person.personId.toString()))) {
        setErrorMessages(["That competitor's results have already been entered"]);
      }
      // If no errors, set the competitor object
      else {
        const newCurrentPersons = currentPersons.map((el, i) => (i !== index ? el : person));

        // Focus on the attempt 1 input, if all names have been entered, or the next competitor input,
        // if all names haven't been entered and the last competitor input is not currently focused
        if (!newCurrentPersons.includes(null)) {
          document.getElementById('solve_1')?.focus();
        } else if (index + 1 < currentPersons.length) {
          document.getElementById(`name_${index + 2}`)?.focus();
        }

        setCurrentPersons(newCurrentPersons);
        setErrorMessages([]);
      }
    });
  };

  const changePersonName = (index: number, value: string) => {
    const newPersonNames = personNames.map((el, i) => (i !== index ? el : value));
    setPersonNames(newPersonNames);

    // Reset the person object for that person
    const newCurrentPersons = currentPersons.map((el, i) => (i !== index ? el : null));
    setCurrentPersons(newCurrentPersons);
  };

  const changeAttempt = (index: number, value: string) => {
    setAttempts(attempts.map((el, i) => (i !== index ? el : value)));
  };

  const resetPersons = (eventId = round.eventId) => {
    const isTeamEvent = compData.events.find((el) => el.eventId === eventId).format === EventFormat.TeamTime;

    setCurrentPersons(isTeamEvent ? [null, null] : [null]);
    setPersonNames(isTeamEvent ? ['', ''] : ['']);
  };

  const resetAttempts = (roundFormat: RoundFormat) => {
    const numberOfSolves = roundFormats[roundFormat].attempts as number;
    setAttempts(Array(numberOfSolves).fill(''));
  };

  const editResult = (result: IResult) => {
    // Delete result and then set the inputs if the deletion was successful
    deleteResult(result.personId, () => {
      const tempCurrPersons = persons.filter((el) => result.personId.split(';').includes(el.personId.toString()));

      setPersonNames(tempCurrPersons.map((el) => el.name));
      setCurrentPersons(tempCurrPersons);
      setAttempts(result.attempts.map((el) => el.toString()));
    });
  };

  const deleteResult = (personId: string, editCallback?: () => void) => {
    if (round.results.length > 1 || round.roundTypeId === RoundType.Final) {
      const newRound: IRound = {
        ...round,
        results: mapRankings(round.results.filter((el) => el.personId !== personId)),
      };

      updateCompetitionEvents(newRound);
      setRound(newRound);

      if (editCallback) editCallback();
    }
    // If it's not the final round and we are deleting the last result, disallow the deletion
    else {
      setErrorMessages(["You may not delete the last result of a round that isn't the final round"]);
    }
  };

  // Takes results that are already sorted
  const mapRankings = (results: IResult[]): IResult[] => {
    if (results.length === 0) return results;

    const newResults: IResult[] = [];
    let prevResult = results[0];
    let ranking = 1;

    for (let i = 0; i < results.length; i++) {
      // If the previous result was not tied with this one, increase ranking
      if (!roundFormats[round.format].isAverage) {
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
            events={compData.events}
            eventId={round.eventId}
            setEventId={(val) => changeRoundAndEvent(1, val)}
          />
          <div className="mb-3 fs-5">
            <label htmlFor="round_number" className="form-label">
              Round
            </label>
            <select
              id="round_number"
              className="form-select"
              value={roundNumber}
              onChange={(e) => changeRoundAndEvent(parseInt(e.target.value))}
            >
              <option value="1">1</option>
              {currCompEvent?.rounds.length >= 1 && <option value="2">2</option>}
              {currCompEvent?.rounds.length >= 2 && <option value="3">3</option>}
              {currCompEvent?.rounds.length >= 3 && <option value="4">4</option>}
            </select>
          </div>
          <div className="mb-3 fs-5">
            <label htmlFor="round_format_id" className="form-label">
              Round Format
            </label>
            <select
              id="round_format_id"
              className="form-select"
              value={round.format}
              onChange={(e) => changeRoundFormat(e.target.value as RoundFormat)}
              disabled={round.results.length > 0}
            >
              {Object.values(roundFormats).map((rf: any) => (
                <option key={rf.id} value={rf.id}>
                  {rf.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            {personNames.map((personName: string, i: number) => (
              <FormTextInput
                key={i}
                name={`Competitor ${i + 1}`}
                id={`name_${i + 1}`}
                value={personName}
                setValue={(val: string) => changePersonName(i, val)}
                onKeyPress={(e: any) => onSelectCompetitor(i, e)}
              />
            ))}
          </div>
          {Array.from(Array(roundFormats[round.format].attempts), (_, i) => (
            <FormTextInput
              key={i}
              id={`solve_${i + 1}`}
              value={attempts[i]}
              placeholder={`Attempt ${i + 1}`}
              setValue={(val: string) => changeAttempt(i, val)}
              onKeyPress={(e: any) => enterAttempt(e, i)}
            />
          ))}
          <div className="d-flex justify-content-between">
            <button
              type="button"
              id="submit_attempt_button"
              onClick={handleSubmitAttempts}
              className="mt-4 btn btn-success"
            >
              Submit
            </button>
            <button type="button" onClick={handleSubmit} className="mt-4 btn btn-primary">
              Submit Results
            </button>
          </div>
        </div>
        <div className="col-9">
          <h2 className="mb-4 text-center">
            {compData.competition.events.length > 0 ? 'Edit' : 'Post'} results for&nbsp;
            {compData.competition.name || 'ERROR'}
          </h2>
          {/* THIS IS A TEMPORARY SOLUTION!!! */}
          <div className="overflow-y-auto" style={{ maxHeight: '650px' }}>
            <RoundResultsTable
              round={round}
              events={compData.events}
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
