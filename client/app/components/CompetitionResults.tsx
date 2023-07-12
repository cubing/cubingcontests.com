'use client';

import { useState } from 'react';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent, IEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';

const CompetitionResults = ({ data: { competition, events, persons } }: { data: ICompetitionData }) => {
  // Find the event held at the competition that has the highest rank.
  // The first event in eventsInfo is always the highest ranked one, as it's sorted on the backend.
  let firstEventByRank: ICompetitionEvent | null = null;
  if (competition.events?.length > 0) {
    firstEventByRank = competition.events.find((el) => el.eventId === events[0].eventId) || null;
    if (!firstEventByRank) console.error(`Event ${events[0].eventId} not found in this competition's events`);
  }

  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(firstEventByRank);

  return (
    <>
      <div className="my-4 px-2 fs-5">
        <p>Date:&#8194;{getFormattedDate(competition.startDate, competition.endDate)}</p>
        <p>
          Location:&#8194;{competition.city}, <b>{getCountry(competition.countryId)}</b>
        </p>
        {competition.participants > 0 && (
          <p>
            Number of participants:&#8194;<b>{competition.participants}</b>
          </p>
        )}
        {competition.description && (
          <>
            <p className="mb-4">Description:</p>
            <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
              {competition.description}
            </p>
          </>
        )}
      </div>
      {competition.events.length === 0 ? (
        <p className="mx-2 fs-5">The results for this contest have not been posted yet</p>
      ) : (
        <>
          <div className="mx-2 d-flex flex-row flex-wrap gap-2">
            {events.map((event: IEvent) => (
              <button
                key={event.eventId}
                onClick={() =>
                  setCurrEvent(
                    competition.events?.find((el: ICompetitionEvent) => el.eventId === event.eventId) || null,
                  )
                }
                className={'btn btn-light' + (currEvent?.eventId === event.eventId ? ' active' : '')}
              >
                {event.name}
              </button>
            ))}
          </div>
          <EventResultsTable event={currEvent} events={events} persons={persons} />
        </>
      )}
    </>
  );
};

export default CompetitionResults;
