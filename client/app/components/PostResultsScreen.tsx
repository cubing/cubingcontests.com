'use client';

import { useState, useEffect } from 'react';
import FormEventSelect from '~/app/components/form/FormEventSelect';
import { ICompetitionEvent } from '@sh/interfaces/Competition';
import IEvent from '@sh/interfaces/Event';
import { IResult } from '@sh/interfaces/Round';
import EventResultsTable from './EventResultsTable';
import FormTextInput from './form/FormTextInput';
import myFetch from '~/helpers/myFetch';
import IPerson from '@sh/interfaces/Person';

// This doesn't want to import for some reason. FIX THIS LATER!
// import { RoundFormat, RoundType } from '@sh/enums';
// import { EventFormat } from '@sh/enums';
export enum RoundFormat {
  Average = 'a',
  Mean = 'm',
  BestOf3 = '3',
  BestOf2 = '2',
  BestOf1 = '1',
}
export enum RoundType {
  First = '1',
  Second = '2',
  Semi = '3',
  Final = 'f',
}
export enum EventFormat {
  Time = 'time',
  Number = 'number', // for FMC
  Multi = 'multi',
  TeamTime = 'teamtime', // e.g. for Team BLD or Team Factory
}

const roundFormats = [
  { id: RoundFormat.Average, label: 'Average of 5', attempts: 5 },
  { id: RoundFormat.Mean, label: 'Mean of 3', attempts: 3 },
  { id: RoundFormat.BestOf3, label: 'Best of 3', attempts: 3 },
  { id: RoundFormat.BestOf2, label: 'Best of 2', attempts: 2 },
  { id: RoundFormat.BestOf1, label: 'Best of 1', attempts: 1 },
];

const PostResultsScreen = ({ events, competitionId }: { events: IEvent[]; competitionId: string }) => {
  const [eventId, setEventId] = useState('333');
  const [roundFormat, setRoundFormat] = useState(RoundFormat.Average);
  const [personNames, setPersonNames] = useState(['']);
  const [currentPersons, setCurrentPersons] = useState<IPerson[]>([]);
  const [attempts, setAttempts] = useState(['', '', '', '', '']);
  const [results, setResults] = useState<IResult[]>([]);
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);

  // For the event results table
  const competitionEvent: ICompetitionEvent = {
    eventId,
    rounds: [
      {
        roundTypeId: RoundType.Final,
        format: roundFormat,
        results,
      },
    ],
  };

  useEffect(() => {
    // Focus the last name input
    document.getElementById(`name_${personNames.length}`)?.focus();
  }, [personNames.length]);

  useEffect(() => {
    logDebug();
  }, [results]);

  const logDebug = () => {
    console.log(`Event ID: ${eventId}; Round format: ${roundFormat}`);
    console.log('Person names:', personNames);
    console.log('Current persons:', currentPersons);
    console.log('All persons', persons);
    console.log('Attempts:', attempts);
    console.log('Results:', results);
    console.log('Competition events', competitionEvents);
  };

  const handleSubmit = async () => {
    const data = {
      events: getNewCompetitionEvents(),
    };

    console.log(data);

    const response = await myFetch.patch(`/competitions/${competitionId}`, data);

    if (response?.errors) {
      console.log(response.errors);
    } else {
      window.location.href = '/admin';
    }
  };

  const handleSubmitAttempts = () => {
    if (currentPersons.length === 0) {
      console.error('Invalid person(s)');
      return;
    }

    for (const att of attempts) {
      // If attempt is empty or if it has invalid characters (THE EXCEPTION FOR - IS TEMPORARY!)
      if (!att || /[^0-9.:-]/.test(att)) {
        console.error('Invalid attempt:', att);
        logDebug();
        return;
      }
    }

    const tempAttempts = attempts.map((el) => getResult(el));
    // If the attempt is 0, -1 or -2, that means it's a special value that is always worse than other values (e.g. DNF)
    let best: number = Math.min(...tempAttempts.map((att) => (att > 0 ? att : Infinity)));
    if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS
    let average: number;

    if (
      tempAttempts.filter((el) => el <= 0).length > 1 ||
      (tempAttempts.filter((el) => el <= 0).length > 0 && tempAttempts.length === 3) ||
      tempAttempts.length < 3 ||
      eventId === '333mbf'
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

      average = Math.round((sum / 3) * (eventId === '333fm' ? 100 : 1));
    }

    let tempResults = results;

    // TO-DO (IT SHOULD CHECK IF THAT USER'S RESULTS HAVE ALREADY BEEN ENTERED)
    tempResults.push({
      personId: currentPersons.map((el) => el.personId.toString()).join(';'),
      ranking: 0, // real ranking assigned further down
      attempts: tempAttempts,
      best,
      average,
    });

    tempResults = tempResults
      .sort((a, b) => {
        if (['a', 'm'].includes(roundFormat)) {
          if (a.average <= 0 && b.average > 0) return 1;
          else if (a.average > 0 && b.average <= 0) return -1;
          return a.average - b.average;
        } else {
          if (a.best <= 0 && b.best > 0) return 1;
          else if (a.best > 0 && b.best <= 0) return -1;
          return a.best - b.best;
        }
      })
      .map((result, index) => {
        return {
          ...result,
          ranking: index + 1,
        };
      });

    setResults(tempResults);
    setPersons((prev) => [...prev, ...currentPersons.filter((cp) => !persons.find((p) => p.personId === cp.personId))]);
    setCurrentPersons([]);
    setPersonNames(['']);
    resetAttempts(roundFormat);
    document.getElementById('name_1')?.focus();
  };

  const getResult = (time: string): number => {
    // If FMC or negative value, return as is, just converted to integer
    if (eventId === '333fm' || time.includes('-')) return parseInt(time);

    time = time.replace(':', '').replace('.', '');

    let minutes = 0;
    if (time.length > 4) {
      minutes = parseInt(time.slice(0, -4));
      time = time.slice(-4);
    }

    const centiseconds = parseInt(time) + minutes * 6000;
    return centiseconds;
  };

  const getNewCompetitionEvents = (): ICompetitionEvent[] => {
    // First remove previous save of this event, if any
    const newCompetitionEvents = competitionEvents.filter((el) => el.eventId !== eventId);

    // Save event results, if any
    if (results.length > 0) {
      newCompetitionEvents.push({
        eventId,
        rounds: [
          {
            roundTypeId: RoundType.Final,
            format: roundFormat,
            results,
          },
        ],
      });
    }

    return newCompetitionEvents;
  };

  const changeEvent = (value: string) => {
    setCompetitionEvents(getNewCompetitionEvents());

    // Check if the selected event has already been saved, and if so, load those results
    const savedCompEvent = competitionEvents.find((el) => el.eventId === value);
    if (savedCompEvent) {
      setResults(savedCompEvent.rounds[0].results);
    } else {
      setResults([]);
    }

    const defRoundFormat: RoundFormat = events.find((ev) => ev.eventId === value)?.defaultRoundFormat as RoundFormat;

    resetAttempts(defRoundFormat);
    setEventId(value);
    setCurrentPersons([]);
    setPersonNames(['']);
    setRoundFormat(defRoundFormat);
  };

  const resetAttempts = (roundFormat: RoundFormat) => {
    const numberOfSolves = roundFormats.find((rf) => rf.id === roundFormat)?.attempts as number;
    setAttempts(Array(numberOfSolves).fill(''));
  };

  const selectCompetitor = async (e: any, index: number) => {
    if (e.key === 'Enter') {
      const results = await myFetch.get(`/persons?searchParam=${personNames[index]}`);

      if (!results.errors && results.length > 0) {
        const newPersonNames = [...personNames.slice(0, -1), results[0].name];

        if (results.length === 1) {
          if (events.find((el) => el.eventId === eventId)?.format === EventFormat.TeamTime) {
            newPersonNames.push('');
            setCurrentPersons((prev) => [...prev, results[0]]);
          } else {
            document.getElementById('solve_1')?.focus();
            setCurrentPersons(results);
          }
        }

        setPersonNames(newPersonNames);
      } else {
        changePersonName(index, 'Person not found');
      }
    }
  };

  const changePersonName = (index: number, value: string) => {
    const newPersonNames = personNames.map((el, i) => (i !== index ? el : value));

    setPersonNames(newPersonNames);
  };

  const changeAttempt = (index: number, value: string) => {
    setAttempts(attempts.map((el, i) => (i !== index ? el : value)));
  };

  const deleteResult = (personId: string) => {
    setResults(results.filter((el) => el.personId !== personId));
  };

  return (
    <div className="row my-4">
      <div className="col-3 pe-4">
        <FormEventSelect events={events} eventId={eventId} setEventId={changeEvent} />
        <div className="mb-3 fs-5">
          <label htmlFor="round_format_id" className="form-label">
            Round Format
          </label>
          <select
            id="round_format_id"
            className="form-select"
            value={roundFormat}
            onChange={(e) => setRoundFormat(e.target.value as RoundFormat)}
          >
            {roundFormats.map((el) => (
              <option key={el.id} value={el.id}>
                {el.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-5">
          {personNames.map((el: string, i: number) => (
            <FormTextInput
              key={i}
              name={`Competitor ${i + 1}`}
              id={`name_${i + 1}`}
              value={el}
              setValue={(val: string) => changePersonName(i, val)}
              onKeyDown={(e: any) => selectCompetitor(e, i)}
            />
          ))}
        </div>
        {Array.from(Array(roundFormats.find((el) => el.id === roundFormat)?.attempts), (_, i) => (
          <FormTextInput
            key={i}
            id={`solve_${i + 1}`}
            value={attempts[i]}
            setValue={(val: string) => changeAttempt(i, val)}
          />
        ))}
        <div className="d-flex justify-content-between">
          <button type="button" onClick={handleSubmitAttempts} className="mt-4 btn btn-success">
            Submit
          </button>
          <button type="button" onClick={handleSubmit} className="mt-4 btn btn-primary">
            Submit Results
          </button>
        </div>
      </div>
      <div className="col-9">
        <EventResultsTable
          event={competitionEvent}
          eventsInfo={events}
          persons={persons}
          onDeleteResult={deleteResult}
        />
      </div>
    </div>
  );
};

export default PostResultsScreen;
