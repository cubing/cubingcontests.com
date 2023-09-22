'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Button from '~/app/components/Button';
import Form from '~/app/components/form/Form';
import { ContestType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { IContest, IEvent, IPerson, IResult, IRound } from '@sh/interfaces';
import C from '@sh/constants';
import { getCentiseconds, getContestIdFromName } from '~/helpers/utilityFunctions';
import { compareAvgs, compareSingles, getRoundRanksWithAverage } from '@sh/sharedFunctions';
import EventResultsTable from '~/app/components/EventResultsTable';
import FormTextInput from '~/app/components/form/FormTextInput';

const setRankings = (results: IResult[], ranksWithAverage: boolean): IResult[] => {
  if (results.length === 0) return results;

  let sortedResults: IResult[];

  if (ranksWithAverage) sortedResults = results.sort(compareAvgs);
  else sortedResults = results.sort(compareSingles);

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
    case `avg5`:
      return RoundFormat.Average;
    case `bo3`:
      return RoundFormat.BestOf3;
    case `bo2`:
      return RoundFormat.BestOf2;
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
  if (value === `DNF`) return -1;
  if (value === `DNS`) return -2;
  return getCentiseconds(value.replaceAll(/[:.]/g, ``));
};

const fetchData = async (setEvents: (val: IEvent[]) => void, setErrorMessages: (val: string[]) => void) => {
  const { payload: events, errors } = await myFetch.get(`/events`);

  if (errors) setErrorMessages(errors);
  else setEvents(events);
};

const ImportExportPage = () => {
  const [events, setEvents] = useState<IEvent[]>();
  const [errorMessages, setErrorMessages] = useState([]);
  const [competitionIdText, setCompetitionIdText] = useState(``);
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [contest, setContest] = useState<IContest>();
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [contestJSON, setContestJSON] = useState(``);

  useEffect(() => {
    fetchData(setEvents, setErrorMessages);
  }, []);

  useEffect(() => {
    if (errorMessages.length > 0) {
      setLoadingDuringSubmit(false);
    }
  }, [errorMessages]);

  const importContest = async () => {
    if (contest) {
      setLoadingDuringSubmit(true);
      setErrorMessages([]);

      const { errors } = await myFetch.post(`/competitions?save_results=true`, contest);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setContest(null);
        setPersons([]);
        setCompetitionIdText(``);
        setContestJSON(``);
      }

      setLoadingDuringSubmit(false);
    }
  };

  const previewContest = async () => {
    setErrorMessages([]);
    setContestJSON(``);
    setLoadingDuringSubmit(true);

    const competitionId = getContestIdFromName(competitionIdText).trim();
    const persons: IPerson[] = []; // used for results preview
    const notFoundPersonNames: string[] = [];

    const { payload: p1, errors: e1 } = await myFetch.get(
      `https://raw.githubusercontent.com/cubing/unofficial.cubing.net/main/data/competitions/${competitionId}/competition-info.json`,
    );
    const { payload: p2, errors: e2 } = await myFetch.get(`${C.wcaApiBase}/competitions/${competitionId}.json`);
    // The WCIF data from the endpoint above doesn't include the competitor limit
    const { payload: p3, errors: e3 } = await myFetch.get(
      `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}`,
    );

    if (e1 || e2 || e3) {
      const errors = [...(e1 ? e1 : []), ...(e2 ? e2 : []), ...(e3 ? e3 : [])];
      setErrorMessages([`There was an error while fetching the data`, ...errors]);
      return;
    }

    const compData = JSON.parse(p1);
    const wcaCompData = JSON.parse(p2);
    const competitorLimit = p3.competitor_limit;
    const startDate = new Date(wcaCompData.date.from);
    const endDate = new Date(wcaCompData.date.till);

    const newContest: IContest = {
      competitionId,
      name: wcaCompData.name,
      type: ContestType.Competition, // THIS IS HARDCODED!!!
      city: wcaCompData.city,
      countryIso2: wcaCompData.country,
      venue: wcaCompData.venue.name.split(`]`)[0].replace(`[`, ``),
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

    // Set organizer objects
    for (const org of wcaCompData.organisers) {
      const { payload: matches, errors } = await myFetch.get(`/persons?searchParam=${org.name}`);

      if (errors) {
        setErrorMessages([`Error while fetching organizer with the name ${org.name}`]);
        return;
      }

      if (matches.length === 1) {
        newContest.organizers.push(matches[0]);
      } else if (matches.length > 1) {
        setErrorMessages([`Multiple organizers found with the name ${org.name}`]);
        return;
      } else {
        notFoundPersonNames.push(org.name);
      }
    }

    // Set contest events
    for (const key of Object.keys(compData.roundsByEvent)) {
      const event = events.find((el) => el.eventId === key);
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

        console.log(roundData);

        if (errors) {
          setErrorMessages([`Error while fetching ${event.eventId} results for ${competitionId}: ${errors[0]}`]);
          return;
        }

        const results: IResult[] = setRankings(
          roundData
            .split(/\n/)
            .slice(1)
            .map((line: string) => line.trim())
            .filter((line: string) => line !== ``)
            .map((line: string): IResult => {
              if (event.eventId !== `333_team_bld`) {
                // The rankings can have mistakes, so they're skipped
                const [ranking, name, average, best, ...attempts] = line.split(`,`);

                return {
                  competitionId,
                  eventId: event.eventId,
                  date,
                  personIds: [name] as any, // personIds are set below
                  ranking: 0,
                  attempts: attempts.map((att) => ({ result: convertTime(att) })),
                  best: convertTime(best),
                  average: convertTime(average),
                };
              } else {
                // The rankings can have mistakes, so they're skipped
                const [ranking, teamName, name1, wcaId1, name2, wcaId2, average, best, ...attempts] = line.split(`,`);

                return {
                  competitionId,
                  eventId: event.eventId,
                  date,
                  personIds: [`${name1}|${wcaId1}`, `${name2}|${wcaId2}`] as any, // personIds are set below
                  ranking: 0,
                  attempts: attempts.map((att) => ({ result: convertTime(att) })),
                  best: convertTime(best),
                  average: convertTime(average),
                };
              }
            }),
          getRoundRanksWithAverage(format, event),
        );

        // Set the personIds
        for (const result of results) {
          for (let j = 0; j < result.personIds.length; j++) {
            const { payload: matches, errors } = await myFetch.get(`/persons?searchParam=${result.personIds[j]}`);

            if (errors) {
              setErrorMessages([`Error while fetching person with the name ${result.personIds[j]}`]);
              return;
            }

            if (matches.length === 1) {
              result.personIds[j] = matches[0].personId;
              persons.push(matches[0]);
            } else if (matches.length > 1) {
              setErrorMessages([`Multiple persons found with the name "${result.personIds[j]}"`]);
              return;
            } else {
              notFoundPersonNames.push(result.personIds[j] as any);
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
          roundId: `${event.eventId}-r${i + 1}`,
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
      if (!notFoundPersonNames.some((el) => el.includes(`|`))) {
        setErrorMessages([`Persons with these names were not found: ${notFoundPersonNames.join(`, `)}`]);
      } else {
        setErrorMessages([
          `Persons with these names / WCA IDs were not found: ${notFoundPersonNames
            .map((el) => {
              const parts = el.split(`|`);
              return parts[1] || parts[0];
            })
            .join(`, `)}`,
        ]);
      }
    } else {
      setContest(newContest);
      setPersons(persons);
    }

    setLoadingDuringSubmit(false);
  };

  return (
    <>
      <h2 className="mb-3 text-center">Import and export contests</h2>

      <Form errorMessages={errorMessages} hideButton>
        <FormTextInput title="Contest name / ID" value={competitionIdText} setValue={setCompetitionIdText} />
        {contest ? (
          <Button text="Import Contest" onClick={importContest} loading={loadingDuringSubmit} />
        ) : (
          <Button text="Preview" onClick={previewContest} />
        )}
      </Form>

      {contestJSON && (
        <div className="mx-auto mb-4" style={{ maxWidth: `900px` }}>
          <h3 className="mb-4 text-center">JSON</h3>
          <p className="p-4 border rounded-4 bg-black text-white font-monospace" style={{ whiteSpace: `pre-wrap` }}>
            {contestJSON}
          </p>
        </div>
      )}

      {contest?.events.length > 0 && (
        <EventResultsTable contestEvent={contest.events[0]} persons={persons} recordTypes={[]} />
      )}
    </>
  );
};

export default ImportExportPage;
