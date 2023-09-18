'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Button from '~/app/components/Button';
import Form from '~/app/components/form/Form';
import { getContestIdFromName } from '~/helpers/utilityFunctions';
import { ContestType } from '@sh/enums';
import { IContest, IEvent } from '@sh/interfaces';
import C from '@sh/constants';

const fetchData = async (setEvents: (val: IEvent[]) => void, setErrorMessages: (val: string[]) => void) => {
  const { payload: events, errors } = await myFetch.get('/events');

  if (errors) setErrorMessages(errors);
  else setEvents(events);
};

const ImportExportPage = () => {
  const [events, setEvents] = useState<IEvent[]>();
  const [errorMessages, setErrorMessages] = useState([]);
  const [contestData, setContestData] = useState('');
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);

  useEffect(() => {
    fetchData(setEvents, setErrorMessages);
  }, []);

  const importContest = async () => {
    setErrorMessages([]);
    setLoadingDuringSubmit(true);

    const rawRounds = contestData.split(/\n\s+/).map((el) => el.trim());
    const newCompetitions: IContest[] = [];
    const processedRounds = [];

    for (const rawRound of rawRounds) {
      // Get the lines, excluding the line with the column names
      const lines = rawRound
        .split(/\n/)
        .filter((el) => !/^rank\sname\saverage/.test(el))
        .map((el) => el.trim());

      const name = lines[0].replace(/ [A-Za-z]+ Round$/, '');
      const competitionId = getContestIdFromName(name);
      console.log(competitionId);

      const { payload: compData, errors } = await myFetch.get(`${C.wcaApiBase}/competitions/${competitionId}.json`);

      if (errors) {
        setErrorMessages([`Please enter the correct competition name for ${name}`]);
        setLoadingDuringSubmit(false);
        return;
      } else {
        console.log(compData);

        const newCompetition: IContest = {
          competitionId,
          name,
          type: ContestType.Competition, // THIS IS HARDCODED!!!
          city: compData.city,
          countryIso2: compData.country_iso2,
          // venue:
          address: compData.venue_address,
          latitudeMicrodegrees: compData.latitude_degrees * 1000000,
          longitudeMicrodegrees: compData.longitude_degrees * 1000000,
          startDate: new Date(compData.start_date),
          endDate: new Date(compData.end_date),
          // organizers:
          competitorLimit: compData.competitor_limit,
          mainEventId: 'fto', // THIS IS HARDCODED!!!
          events: [
            {
              event: events.find((el) => el.eventId === 'fto'), // THIS IS HARDCODED!!!
              rounds: [],
            },
          ],
          // compDetails
        } as IContest;

        console.log(newCompetition);
      }
    }

    setLoadingDuringSubmit(false);
  };

  return (
    <>
      <h2 className="mb-3 text-center">Import and export contests</h2>

      <Form errorMessages={errorMessages} hideButton>
        <div className="mb-4">
          <label htmlFor="import_data" className="form-label">
            Contest data
          </label>
          <textarea
            id="import_data"
            rows={15}
            value={contestData}
            onChange={(e: any) => setContestData(e.target.value)}
            className="form-control bg-secondary-subtle"
          />
        </div>
        <Button text="Import Contest" onClick={importContest} loading={loadingDuringSubmit} />
      </Form>
    </>
  );
};

export default ImportExportPage;
