'use client';

import { useState, useMemo } from 'react';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent, IEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType } from '@sh/enums';

const CompetitionResults = ({ data: { competition, events, persons, timezoneOffset } }: { data: ICompetitionData }) => {
  const [activeTab, setActiveTab] = useState(1);
  // Find the event held at the competition that has the highest rank.
  // The first event in events[] is always the highest ranked one, as it's sorted on the backend.
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(
    competition.events.find((el) => el.eventId === events[0].eventId),
  );

  const startDate = useMemo(() => new Date(competition.startDate), [competition]);
  const endDate = useMemo(() => (competition.endDate ? new Date(competition.endDate) : null), [competition]);
  const formattedDate = useMemo(() => getFormattedDate(startDate, endDate), [startDate, endDate]);
  const formattedTime = useMemo(() => {
    const offsetDate = new Date(startDate.getTime() + timezoneOffset * 60000);
    const mins = (offsetDate.getUTCMinutes() < 10 ? '0' : '') + offsetDate.getUTCMinutes();
    return `${offsetDate.getUTCHours()}:${mins}`;
  }, [startDate]);

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
        <div className="row px-2 fs-5">
          <div className="col-md-5">
            <p>
              Type:&#8194;<b>{competition.type === CompetitionType.Meetup ? 'Meetup' : 'Competition'}</b>
            </p>
            <p>Date:&#8194;{formattedDate}</p>
            {competition.type === CompetitionType.Meetup && <p>Starts at:&#8194;{formattedTime}</p>}
            <p>
              City:&#8194;{competition.city}, <b>{getCountry(competition.countryId)}</b>
            </p>
            {competition.venue && <p>Venue:&#8194;{competition.venue}</p>}
            {competition.coordinates && <p>Coordinates:&#8194;{competition.coordinates.join(', ')}</p>}
            {competition.contact && <p>Contact:&#8194;{competition.contact}</p>}
            {competition.organizers && <p>Organizers:&#8194;{competition.organizers.map((el) => el.name).join(' ')}</p>}
            <p>
              Competitor limit:&#8194;<b>{competition.competitorLimit}</b>
            </p>
            {competition.participants > 0 && (
              <p>
                Number of participants:&#8194;<b>{competition.participants}</b>
              </p>
            )}
          </div>
          <hr className="d-md-none mt-3 mb-4" />
          <div className="col-md-7">
            {competition.state === CompetitionState.Ongoing && (
              <p className="mb-4">This competition is currently ongoing</p>
            )}
            {competition.description && (
              <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
                <b>Description:</b>&#8195;{competition.description}
              </p>
            )}
          </div>
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
