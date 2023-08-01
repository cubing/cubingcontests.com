'use client';

import { useState, useMemo } from 'react';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent, IEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType } from '@sh/enums';

const CompetitionResults = ({ data: { competition, persons, timezoneOffset } }: { data: ICompetitionData }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent>(competition.events[0]);

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
            {competition.state < CompetitionState.Ongoing ? 'Events' : 'Results'}
          </button>
        </li>
      </ul>

      {activeTab === 1 && (
        // For some reason if you remove w-100, it wants to be even wider and causes horizontal scrolling :/
        <div className="row w-100 px-2 fs-5">
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
            {competition.address && <p>Address:&#8194;{competition.address}</p>}
            {competition.latitude && (
              <p>
                Coordinates:&#8194;{competition.latitude}, {competition.longitude}
              </p>
            )}
            {competition.contact && <p>Contact:&#8194;{competition.contact}</p>}
            {competition.organizers && <p>Organizers:&#8194;{competition.organizers.map((el) => el.name).join(' ')}</p>}
            {competition.competitorLimit && (
              <p>
                Competitor limit:&#8194;<b>{competition.competitorLimit}</b>
              </p>
            )}
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
            {competition.events.map((compEvent: ICompetitionEvent) => (
              <button
                key={compEvent.event.eventId}
                onClick={() => setCurrEvent(compEvent)}
                className={'btn btn-light' + (currEvent === compEvent ? ' active' : '')}
              >
                {compEvent.event.name}
              </button>
            ))}
          </div>
          <EventResultsTable compEvent={currEvent} persons={persons} />
        </>
      )}
    </>
  );
};

export default CompetitionResults;
