'use client';

import { useState } from 'react';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent, IEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType } from '@sh/enums';

const CompetitionResults = ({ data: { competition, events, persons } }: { data: ICompetitionData }) => {
  const [activeTab, setActiveTab] = useState(1);
  // Find the event held at the competition that has the highest rank.
  // The first event in events[] is always the highest ranked one, as it's sorted on the backend.
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(
    competition.events.find((el) => el.eventId === events[0].eventId),
  );

  return (
    <>
      <ul className="mb-3 nav nav-tabs">
        <li className="me-2 nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 1 ? ' active' : '')}
            onClick={() => setActiveTab(1)}
          >
            General Info
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 2 ? ' active' : '')}
            onClick={() => setActiveTab(2)}
          >
            {competition.state === CompetitionState.Created ? 'Events' : 'Results'}
          </button>
        </li>
      </ul>

      {activeTab === 1 && (
        <div className="d-md-flex px-2 fs-5">
          <div className="pe-5">
            <p>
              Type:&#8194;<b>{competition.type === CompetitionType.Meetup ? 'Meetup' : 'Competition'}</b>
            </p>
            <p>Date:&#8194;{getFormattedDate(competition.startDate, competition.endDate)}</p>
            <p>
              City:&#8194;{competition.city}, <b>{getCountry(competition.countryId)}</b>
            </p>
            {competition.venue && <p>{competition.venue}</p>}
            {competition.coordinates && <p>Coordinates: {competition.coordinates.join(', ')}</p>}
            {competition.contact && <p>Contact: {competition.contact}</p>}
            {competition.organizers && <p>Organizers: {competition.organizers.map((el) => el.name).join(' ')}</p>}
            <p>
              Competitor limit:&#8194;<b>{competition.competitorLimit}</b>
            </p>
            {competition.participants > 0 && (
              <p>
                Number of participants:&#8194;<b>{competition.participants}</b>
              </p>
            )}
          </div>
          {competition.description && (
            <div className="pt-3 pt-md-0 ps-md-5">
              <p className="mb-4">Description:</p>
              <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
                {competition.description}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
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
