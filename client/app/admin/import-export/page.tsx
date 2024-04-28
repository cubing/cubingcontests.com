'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Button from '@c/UI/Button';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import ContestResults from '~/app/components/ContestResults';
import { RoundFormat, RoundProceed, RoundType, WcaRecordType } from '@sh/enums';
import { IContestDto, IEvent, IPerson, IRecordPair, IRecordType, IResult, IRound } from '@sh/types';
import { fetchPerson, getContestIdFromName, getWcaCompetitionDetails } from '~/helpers/utilityFunctions';
import {
  compareAvgs,
  compareSingles,
  getDefaultAverageAttempts,
  getRoundRanksWithAverage,
  getBestAndAverage,
} from '@sh/sharedFunctions';
import { roundFormats } from '@sh/roundFormats';

const setRankingsAndRecords = (
  results: IResult[],
  event: IEvent,
  ranksWithAverage: boolean,
  recordPairs: IRecordPair[],
): IResult[] => {
  if (results.length === 0) return results;

  const sortedResults: IResult[] = results.sort(ranksWithAverage ? compareAvgs : compareSingles);
  let prevResult = sortedResults[0];
  let ranking = 1;
  let bestSingleResults: IResult[] = [];
  let bestAvgResults: IResult[] = [];
  const mockRecordResult = { best: recordPairs[0].best, average: recordPairs[0].average } as IResult;

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

    if (sortedResults[i].best > 0) {
      if (compareSingles(sortedResults[i], mockRecordResult) === 0) {
        bestSingleResults.push(sortedResults[i]);
      } else if (compareSingles(sortedResults[i], mockRecordResult) < 0) {
        bestSingleResults = [sortedResults[i]];
        mockRecordResult.best = sortedResults[i].best; // update the record
      }
    }

    if (sortedResults[i].average > 0 && sortedResults[i].attempts.length === getDefaultAverageAttempts(event)) {
      if (compareAvgs(sortedResults[i], mockRecordResult, true) === 0) {
        bestAvgResults.push(sortedResults[i]);
      } else if (compareAvgs(sortedResults[i], mockRecordResult, true) < 0) {
        bestAvgResults = [sortedResults[i]];
        mockRecordResult.average = sortedResults[i].average; // update the record
      }
    }
  }

  for (const result of bestSingleResults) result.regionalSingleRecord = WcaRecordType.WR;
  for (const result of bestAvgResults) result.regionalAverageRecord = WcaRecordType.WR;

  return sortedResults;
};

const convertRoundFormat = (value: string): RoundFormat => {
  switch (value) {
    case 'avg5':
      return RoundFormat.Average;
    case 'mo3':
      return RoundFormat.Mean;
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

const convertEventId = (value: string): string => {
  switch (value) {
    case '333_team_bld':
      return '333_team_bld_old';
    case '333_match_the_scramble':
      return '333mts';
    case 'square1_bld':
      return 'sq1_bld';
    case '333_no_inspection':
      return '333_inspectionless';
    case '222_bld':
      return '222bf';
    case 'relay_222_333_444':
      return '234relay';
    case '222_oh':
      return '222oh';
    default:
      return value;
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
  return Number(value.slice(0, value.indexOf('.') + 3).replace('.', ''));
};

const ImportExportPage = () => {
  const [errorMessages, setErrorMessages] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [events, setEvents] = useState<IEvent[]>();
  const [activeRecordTypes, setActiveRecordTypes] = useState<IRecordType[]>();
  const [loadingId, setLoadingId] = useState('');

  const [competitionIdText, setCompetitionIdText] = useState('');
  const [contest, setContest] = useState<IContestDto>();
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [contestJSON, setContestJSON] = useState('');

  useEffect(() => {
    myFetch.get('/events/mod', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setEvents(payload);
    });

    myFetch.get('/record-types?active=true', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setActiveRecordTypes(payload);
    });
  }, []);

  useEffect(() => {
    if (errorMessages.length > 0) {
      setLoadingId('');
    }
  }, [errorMessages]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const importContest = async () => {
    if (contest) {
      setLoadingId('import_button');
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

      setLoadingId('');
    }
  };

  const previewContest = async () => {
    if (competitionIdText.trim() === '') return;

    setErrorMessages([]);
    setSuccessMessage('');
    setContestJSON('');
    setLoadingId('preview_button');

    const competitionId = getContestIdFromName(competitionIdText.trim());
    const persons: IPerson[] = []; // used for results preview
    const notFoundPersonNames: string[] = [];
    let newContest: IContestDto;

    try {
      newContest = await getWcaCompetitionDetails(competitionId);
    } catch (err: any) {
      setErrorMessages([err.message]);
      return;
    }

    const { payload: unofficialCompData, errors } = await myFetch.get(
      `https://raw.githubusercontent.com/cubing/unofficial.cubing.net/main/data/competitions/${competitionId}/competition-info.json`,
    );

    if (errors) {
      setErrorMessages(errors);
      return;
    }

    // Set contest events
    for (const key of Object.keys(unofficialCompData.roundsByEvent)) {
      const ccEventId = convertEventId(key);
      const event = events.find((el) => el.eventId === ccEventId);

      if (!event) {
        setErrorMessages([`Event with ID ${ccEventId} not found`]);
        return;
      }

      const roundsInfo = unofficialCompData.roundsByEvent[key];
      const rounds: IRound[] = [];

      for (let i = 0; i < roundsInfo.length; i++) {
        const date = new Date(roundsInfo[i].roundEndDate);

        if (date.toString() === 'Invalid Date') {
          setErrorMessages([`The date for ${ccEventId} round ${i + 1} is invalid`]);
          return;
        }

        const format = convertRoundFormat(roundsInfo[i].roundFormatID);
        const { payload: recordPairsByEvent, errors: e1 } = await myFetch.get(
          `/results/record-pairs/${date}/${ccEventId}`,
          { authorize: true },
        );

        if (e1) {
          setErrorMessages([`Error while fetching ${ccEventId} record pairs for ${competitionId}: ${e1[0]}`]);
          return;
        }

        if (date.getTime() > newContest.endDate.getTime() || date.getTime() < newContest.startDate.getTime()) {
          const message = `Round date is outside the date range for competition ${competitionId}`;
          setErrorMessages([message]);
          throw new Error(message);
        }

        const { payload: roundData, errors: e2 } = await myFetch.get(
          `https://raw.githubusercontent.com/cubing/unofficial.cubing.net/main/data/competitions/${competitionId}/round-results/${key}-round${
            i + 1
          }.csv`,
        );

        if (e2) {
          setErrorMessages([`Error while fetching ${ccEventId} results for ${competitionId}: ${e2[0]}`]);
          return;
        }

        const newRound = {
          roundId: `${ccEventId}-r${i + 1}`,
          competitionId,
          roundTypeId: getRoundType(i, roundsInfo.length),
          format,
          results: [] as IResult[],
        };
        const lines = roundData.split(/\n/);
        const fields = lines[0].split(',');

        newRound.results = setRankingsAndRecords(
          lines
            .slice(1)
            .map((line: string) => line.trim())
            .filter((line: string) => line !== '')
            .map((line: string): IResult => {
              const parts = line.split(',');
              const personNames: string[] = []; // can also hold the WCA ID
              let attempts = [];

              for (let i = 1; i < fields.length; i++) {
                if (['name', 'name1'].includes(fields[i])) {
                  if (personNames[0]) personNames[0] = parts[i] + personNames[0];
                  else personNames.push(parts[i]);
                } else if (['wcaID', 'wcaID1'].includes(fields[i])) {
                  if (parts[i]) personNames.push(`|${parts[i]}`);
                } else if (fields[i] === 'name2') {
                  if (personNames[1]) personNames[1] = parts[i] + personNames[1];
                  else personNames.push(parts[i]);
                } else if (fields[i] === 'wcaID2') {
                  if (parts[i]) personNames.push(`|${parts[i]}`);
                } else if (fields[i].includes('attempt')) {
                  attempts.push({ result: convertTime(parts[i]) });
                }
              }

              // Sometimes there are inconsistencies, where 5 attempts are filled in despite the round format
              attempts = attempts.slice(0, roundFormats.find((rf) => rf.value === format).attempts);
              const { best, average } = getBestAndAverage(attempts, event, { round: newRound });

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
          event,
          getRoundRanksWithAverage(format),
          recordPairsByEvent[0].recordPairs,
        );

        // Set the personIds and make sure there are no competitors in the round who have multiple results
        const roundPersonIds: number[] = [];

        for (const result of newRound.results) {
          for (let j = 0; j < result.personIds.length; j++) {
            const name = result.personIds[j] as any;
            let person: IPerson;

            try {
              person = await fetchPerson(name);
            } catch (err: any) {
              setErrorMessages([err.message]);
              return;
            }

            if (person !== null) {
              if (!roundPersonIds.some((pId) => pId === person.personId)) {
                result.personIds[j] = person.personId;
                roundPersonIds.push(person.personId);
                persons.push(person);
              } else {
                console.error('Round results:', newRound.results);
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
            value: newRound.results.length,
          };
        }

        rounds.push(newRound);
      }

      newContest.events.push({ event, rounds });
    }

    const tempErrors: string[] = [];

    if (!newContest.venue)
      tempErrors.push('The venue is missing. Make SURE to enter it before approving the imported contest.');
    if (!newContest.address)
      tempErrors.push('The address is missing. Make SURE to enter it before approving the imported contest.');

    setContestJSON(JSON.stringify(newContest, null, 2));

    if (notFoundPersonNames.length > 0) {
      if (!notFoundPersonNames.some((el) => el.includes('|'))) {
        tempErrors.push(`Persons with these names were not found: ${notFoundPersonNames.join(', ')}`);
      } else {
        tempErrors.push(
          `Persons with these names / WCA IDs were not found: ${notFoundPersonNames
            .map((el) => {
              const parts = el.split('|');
              return parts[1] || parts[0];
            })
            .join(', ')}`,
        );
      }
    } else {
      setContest(newContest);
      setPersons(persons);
    }

    setErrorMessages(tempErrors);
    setLoadingId('');
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
          setValue={setCompetitionIdText}
          disabled={!!contest}
        />
        {contest ? (
          <div className="d-flex gap-3">
            <Button
              id="import_button"
              text="Import Contest"
              onClick={importContest}
              disabled={!!loadingId}
              loadingId={loadingId}
            />
            <Button text="Cancel" onClick={cancelImport} disabled={!!loadingId} className="btn btn-danger" />
          </div>
        ) : (
          <Button id="preview_button" text="Preview" onClick={previewContest} loadingId={loadingId} />
        )}
      </Form>

      {contestJSON && (
        <div className="w-100 mx-auto mb-5" style={{ maxWidth: '900px' }}>
          <h3 className="mb-4 text-center">JSON</h3>
          <p
            className="mx-2 p-4 border rounded-4 bg-black text-white font-monospace overflow-y-auto"
            style={{ whiteSpace: 'pre-wrap', maxHeight: '450px' }}
          >
            {contestJSON}
          </p>
        </div>
      )}

      {contest?.events.length > 0 && (
        <ContestResults contest={contest} persons={persons} activeRecordTypes={activeRecordTypes} />
      )}
    </div>
  );
};

export default ImportExportPage;
