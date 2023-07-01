'use client';

import { useState } from 'react';
import Countries from '@sh/Countries';
import EventResultsTable from './EventResultsTable';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import IEvent from '@sh/interfaces/Event';

const CompetitionResults = ({ data: { competition, eventsInfo, persons } }: { data: ICompetitionData }) => {
  // Find the event held at the competition that has the highest rank.
  // The first event in eventsInfo is always the highest ranked one, as it's sorted on the backend.
  let firstEventByRank: ICompetitionEvent | null = null;
  if (competition.events?.length > 0) {
    firstEventByRank = competition.events.find((el) => el.eventId === eventsInfo[0].eventId) || null;
  }

  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(firstEventByRank);

  const getLocation = (): string => {
    return `${competition.city}, ${Countries.find((el) => el.code === competition.countryId)?.name}`;
  };

  return (
    <>
      <div className="mt-5 mb-3 px-2 fs-5">
        <p>
          Location:&#8194;
          <b>{getLocation()}</b>
        </p>
        {competition.participants > 0 && (
          <p>
            Number of participants:&#8194;<b>{competition.participants}</b>
          </p>
        )}
      </div>
      {competition.events.length === 0 ? (
        <p className="mx-2 fs-5">The results for this contest have not been posted yet</p>
      ) : (
        <>
          <div className="mb-5 mx-2 d-flex flex-row flex-wrap gap-2">
            {eventsInfo.map((event: IEvent) => (
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
          <EventResultsTable event={currEvent} eventsInfo={eventsInfo} persons={persons} />
        </>
      )}
    </>
  );
};

export default CompetitionResults;
