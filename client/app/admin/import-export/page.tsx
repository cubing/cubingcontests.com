'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Button from '@c/Button';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import ContestResults from '~/app/components/ContestResults';
import { ContestType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { IContest, IEvent, IPerson, IResult, IRound } from '@sh/interfaces';
import C from '@sh/constants';
import { getBestAndAverage, getCentiseconds, getContestIdFromName } from '~/helpers/utilityFunctions';
import { compareAvgs, compareSingles, getRoundRanksWithAverage } from '@sh/sharedFunctions';

const setRankings = (results: IResult[], ranksWithAverage: boolean): IResult[] => {
  if (results.length === 0) return results;

  const sortedResults: IResult[] = results.sort(ranksWithAverage ? compareAvgs : compareSingles);
  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage && compareAvgs(prevResult, sortedResults[i]) < 0) ||
        (!ranksWithAverage && compareSingles(prevResult, sortedResults[i]) < 0))
    ) {
      ranking = i + 1;
    }

    sortedResults[i].ranking = ranking;
    prevResult = sortedResults[i];
  }

  return sortedResults;
};

const convertRoundFormat = (value: string): RoundFormat => {
  switch (value) {
    case 'avg5':
      return RoundFormat.Average;
    case 'bo3':
      return RoundFormat.BestOf3;
    case 'bo2':
      return RoundFormat.BestOf2;
    case 'bo1':
      return RoundFormat.BestOf1;
    default:
      throw new Error(`Unknown round format: ${value}`);
  }
};

const getRoundType = (index: number, totalRounds: number): RoundType => {
  if (index + 1 === totalRounds) return RoundType.Final;
  if (index === totalRounds) return RoundType.Semi;
  return (index + 1).toString() as RoundType;
};

const convertTime = (value: string): number => {
  if (value === 'DNF') return -1;
  if (value === 'DNS') return -2;
  return getCentiseconds(value.replaceAll(/[:.]/g, ''));
};

const ImportExportPage = () => {
  const [errorMessages, setErrorMessages] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [events, setEvents] = useState<IEvent[]>();
  const [competitionIdText, setCompetitionIdText] = useState('');
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [contest, setContest] = useState<IContest>();
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [contestJSON, setContestJSON] = useState('');

  useEffect(() => {
    myFetch.get('/events/mod', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setEvents(payload);
    });
  }, []);

  useEffect(() => {
    if (errorMessages.length > 0) {
      setLoadingDuringSubmit(false);
    }
  }, [errorMessages]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const importContest = async () => {
    if (contest) {
      setLoadingDuringSubmit(true);
      setErrorMessages([]);
      setSuccessMessage('');

      const { errors } = await myFetch.post('/competitions?saveResults=true', contest);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setContest(null);
        setPersons([]);
        setCompetitionIdText('');
        setContestJSON('');
        setSuccessMessage('Contest successfully imported');
      }

      setLoadingDuringSubmit(false);
    }
  };

  // null means person not found, undefined means there was an errorr
  const fetchPerson = async (name: string): Promise<IPerson | null | undefined> => {
    const newPerson = { personId: 0, name: '', wcaId: '', countryIso2: '', createdBy: '' };
    // If the WCA ID is available, use that
    const parts = name.split('|');

    if (parts[1]) {
      // Create new person using WCA person info
      const { payload: wcaPerson, errors } = await myFetch.get(`${C.wcaApiBase}/persons/${parts[1]}.json`);

      if (errors) {
        setErrorMessages(errors);
        return undefined;
      } else if (wcaPerson) {
        newPerson.name = wcaPerson.name;
        newPerson.wcaId = parts[1];
        newPerson.countryIso2 = wcaPerson.country;

        const { payload: person, errors } = await myFetch.post('/persons/create-or-get', newPerson);

        if (errors) {
          setErrorMessages(errors);
          return undefined;
        } else {
          return person;
        }
      }
    }

    // If not, first try looking in the CC database
    const englishNameOnly = name.split('(')[0].trim(); // get rid of the ( and everything after it
    const { payload, errors: e1 } = await myFetch.get(`/persons?searchParam=${englishNameOnly}&exactMatch=true`);

    if (e1) {
      setErrorMessages([`Error while fetching person with the name ${name}`]);
      return undefined;
    } else if (payload) {
      return payload;
    }

    // If not found, try searching for exact name matches in the WCA database
    const {
      payload: { result: wcaPersonMatches },
      errors,
    } = await myFetch.get(
      `https://www.worldcubeassociation.org/api/v0/search/users?q=${englishNameOnly}&persons_table=true`,
    );

    if (errors) {
      setErrorMessages(errors);
      return undefined;
    } else if (wcaPersonMatches.length === 1) {
      // Same code as above in the WCA ID search section
      newPerson.name = wcaPersonMatches[0].name;
      newPerson.wcaId = wcaPersonMatches[0].wca_id;
      newPerson.countryIso2 = wcaPersonMatches[0].country.iso2;

      const { payload: person, errors } = await myFetch.post('/persons/create-or-get', newPerson);

      if (errors) {
        setErrorMessages(errors);
        return undefined;
      } else {
        return person;
      }
    }

    return null;
  };

  const previewContest = async () => {
    setErrorMessages([]);
    setSuccessMessage('');
    setContestJSON('');
    setLoadingDuringSubmit(true);

    const competitionId = getContestIdFromName(competitionIdText.trim());
    const persons: IPerson[] = []; // used for results preview
    const notFoundPersonNames: string[] = [];

    const { payload: compData, errors: e1 } = await myFetch.get(
      `https://raw.githubusercontent.com/cubing/unofficial.cubing.net/main/data/competitions/${competitionId}/competition-info.json`,
    );
    const { payload: wcaCompData, errors: e2 } = await myFetch.get(
      `${C.wcaApiBase}/competitions/${competitionId}.json`,
    );
    // The WCIF data from the endpoint above doesn't include the competitor limit
    const { payload, errors: e3 } = await myFetch.get(
      `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}`,
    );

    if (e1 || e2 || e3) {
      const errors = [...(e1 ? e1 : []), ...(e2 ? e2 : []), ...(e3 ? e3 : [])];
      setErrorMessages(['There was an error while fetching the data', ...errors]);
      return;
    }

    const competitorLimit = payload.competitor_limit;
    const startDate = new Date(wcaCompData.date.from);
    const endDate = new Date(wcaCompData.date.till);

    const newContest: IContest = {
      competitionId,
      name: wcaCompData.name,
      type: ContestType.Competition, // THIS IS HARDCODED!!!
      city: wcaCompData.city,
      countryIso2: wcaCompData.country,
      venue: wcaCompData.venue.name.split(']')[0].replace('[', ''),
      address: wcaCompData.venue.address,
      latitudeMicrodegrees: wcaCompData.venue.coordinates.latitude * 1000000,
      longitudeMicrodegrees: wcaCompData.venue.coordinates.longitude * 1000000,
      startDate,
      endDate,
      organizers: [], // this is set below
      description: `Unofficial events from ${wcaCompData.name}. For official events see the official [WCA competition page](https://worldcubeassociation.org/competitions/${competitionId}).`,
      competitorLimit,
      mainEventId: Object.keys(compData.roundsByEvent)[0],
      events: [],
      // compDetails.schedule needs to be set by an admin manually after the competition has been imported
    };

    if (newContest.mainEventId === '333_team_bld') newContest.mainEventId = '333tbfo';

    // Set organizer objects
    for (const org of [...wcaCompData.organisers, ...wcaCompData.wcaDelegates]) {
      const person = await fetchPerson(org.name);

      if (person === undefined) return;
      if (person !== null) {
        if (!newContest.organizers.some((el) => el.personId === person.personId)) newContest.organizers.push(person);
      } else if (!notFoundPersonNames.includes(org.name)) {
        notFoundPersonNames.push(org.name);
      }
    }

    // Set contest events
    for (const key of Object.keys(compData.roundsByEvent)) {
      const ccEventId = key === '333_team_bld' ? '333tbfo' : key;
      const event = events.find((el) => el.eventId === ccEventId);
      const roundsInfo = compData.roundsByEvent[key];
      const rounds: IRound[] = [];

      for (let i = 0; i < roundsInfo.length; i++) {
        const date = new Date(roundsInfo[i].roundEndDate);
        const format = convertRoundFormat(roundsInfo[i].roundFormatID);

        if (date.getTime() > endDate.getTime() || date.getTime() < startDate.getTime()) {
          const message = `Round time is outside the date range for competition ${competitionId}`;
          setErrorMessages([message]);
          throw new Error(message);
        }

        const { payload: roundData, errors } = await myFetch.get(
          `https://raw.githubusercontent.com/cubing/unofficial.cubing.net/main/data/competitions/${competitionId}/round-results/${key}-round${
            i + 1
          }.csv`,
        );

        if (errors) {
          setErrorMessages([`Error while fetching ${ccEventId} results for ${competitionId}: ${errors[0]}`]);
          return;
        }

        const lines = roundData.split(/\n/);

        const results: IResult[] = setRankings(
          lines
            .slice(1)
            .map((line: string) => line.trim())
            .filter((line: string) => line !== '')
            .map((line: string): IResult => {
              const fields = lines[0].split(',');
              const parts = line.split(',');
              const personNames = [];
              const attempts = [];

              for (let i = 1; i < fields.length; i++) {
                if (['name', 'name1'].includes(fields[i])) {
                  personNames.push(parts[i]);
                } else if (fields[i] === 'wcaID1') {
                  personNames[0] += `|${parts[i]}`;
                } else if (fields[i] === 'name2') {
                  personNames.push(parts[i]);
                } else if (fields[i] === 'wcaID2') {
                  personNames[1] += `|${parts[i]}`;
                } else if (fields[i].includes('attempt')) {
                  attempts.push({ result: convertTime(parts[i]) });
                }
              }

              const { best, average } = getBestAndAverage(attempts, event);

              return {
                competitionId,
                eventId: ccEventId,
                date,
                personIds: personNames as any, // personIds are set below
                ranking: 0,
                attempts,
                best,
                average,
              };
            }),
          getRoundRanksWithAverage(format),
        );

        // Set the personIds
        for (const result of results) {
          for (let j = 0; j < result.personIds.length; j++) {
            const name = result.personIds[j] as any;
            const person = await fetchPerson(name);

            if (person === undefined) return;
            if (person !== null) {
              if (!persons.some((p) => p.personId === person.personId)) {
                result.personIds[j] = person.personId;
                persons.push(person);
              } else {
                setErrorMessages([`${person.name} is included in the results twice`]);
                return;
              }
            } else if (!notFoundPersonNames.includes(name)) {
              notFoundPersonNames.push(name);
            }
          }
        }

        // If this is not the first round, set the previous round's proceed object
        if (i > 0) {
          rounds[i - 1].proceed = {
            type: RoundProceed.Number,
            value: results.length,
          };
        }

        rounds.push({
          roundId: `${ccEventId}-r${i + 1}`,
          competitionId,
          date,
          roundTypeId: getRoundType(i, roundsInfo.length),
          format,
          results,
        });
      }

      newContest.events.push({ event, rounds });
    }

    setContestJSON(JSON.stringify(newContest, null, 2));

    if (notFoundPersonNames.length > 0) {
      if (!notFoundPersonNames.some((el) => el.includes('|'))) {
        setErrorMessages([`Persons with these names were not found: ${notFoundPersonNames.join(', ')}`]);
      } else {
        setErrorMessages([
          `Persons with these names / WCA IDs were not found: ${notFoundPersonNames
            .map((el) => {
              const parts = el.split('|');
              return parts[1] || parts[0];
            })
            .join(', ')}`,
        ]);
      }
    } else {
      setContest(newContest);
      setPersons(persons);
    }

    setLoadingDuringSubmit(false);
  };

  const cancelImport = () => {
    setErrorMessages([]);
    setContestJSON('');
    setContest(null);
    setPersons([]);
    setCompetitionIdText('');
  };

  return (
    <div>
      <h2 className="mb-3 text-center">Import and export contests</h2>

      <Form errorMessages={errorMessages} successMessage={successMessage} hideButton>
        <FormTextInput
          title="Contest name / ID"
          value={competitionIdText}
          onChange={setCompetitionIdText}
          disabled={!!contest}
        />
        {contest ? (
          <div className="d-flex gap-3">
            <Button text="Import Contest" onClick={importContest} loading={loadingDuringSubmit} />
            <button type="button" className="btn btn-danger" onClick={cancelImport} disabled={loadingDuringSubmit}>
              Cancel
            </button>
          </div>
        ) : (
          <Button text="Preview" onClick={previewContest} loading={loadingDuringSubmit} />
        )}
      </Form>

      {contestJSON && (
        <div className="w-100 mx-auto mb-3" style={{ maxWidth: '900px' }}>
          <h3 className="mb-4 text-center">JSON</h3>
          <p
            className="mx-2 p-4 border rounded-4 bg-black text-white font-monospace overflow-y-auto"
            style={{ whiteSpace: 'pre-wrap', maxHeight: '450px' }}
          >
            {contestJSON}
          </p>
        </div>
      )}

      {contest?.events.length > 0 && <ContestResults contest={contest} persons={persons} />}
    </div>
  );
};

export default ImportExportPage;
