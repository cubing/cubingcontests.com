'use client';

import { useState } from 'react';
import Countries from '@sh/Countries';
import EventResultsTable from './EventResultsTable';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import IEvent from '@sh/interfaces/Event';

const CompetitionResults = ({ data: { competition, eventsInfo, persons } }: { data: ICompetitionData }) => {
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(
    competition.events?.length > 0 ? competition.events[0] : null,
  );

  return (
    <>
      <div className="mt-5 mb-3 fs-5">
        <p>
          Location:&#8194;
          <b>
            {competition.city}, {Countries.find((el) => el.code === competition.countryId)?.name}
          </b>
        </p>
        {competition.participants && (
          <p>
            Number of participants:&#8194;<b>{competition.participants}</b>
          </p>
        )}
      </div>
      {competition.events.length === 0 ? (
        <p className="fs-5">The results for this competition have not been posted yet</p>
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
