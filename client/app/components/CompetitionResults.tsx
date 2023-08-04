'use client';

import { useState, useMemo } from 'react';
import { utcToZonedTime, format } from 'date-fns-tz';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate, getFormattedCoords } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType } from '@sh/enums';
import Tabs from './Tabs';
import Schedule from './Schedule';

const CompetitionResults = ({ data: { competition, persons } }: { data: ICompetitionData }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent>(competition.events[0]);

  const tabs = useMemo(
    () =>
      competition.type === CompetitionType.Competition
        ? ['General Info', 'Results', 'Schedule']
        : ['General Info', 'Results'],
    [competition],
  );
  const formattedDate = useMemo(
    () => getFormattedDate(competition.startDate, competition.endDate ? competition.endDate : null),
    [competition],
  );
  const formattedTime = useMemo(
    () =>
      competition.type === CompetitionType.Meetup
        ? format(utcToZonedTime(competition.startDate, competition.timezone), 'HH:mm')
        : null,
    [competition],
  );

  const getFormattedOrganizers = (): string => {
    return competition.organizers.map((el) => el.name).join(', ');
  };

  const getFormattedDescription = () => {
    // This parses links using markdown link syntax
    const markdownLinkRegex = /(\[[^\]]*\]\(https?:\/\/[^)]*\))/g;
    const tempString = competition.description.replace(markdownLinkRegex, ':::::$1:::::');
    const output = tempString.split(':::::').map((part, index) =>
      markdownLinkRegex.test(part) ? (
        <a key={index} href={/\((https?:\/\/[^)]*)\)/.exec(part)[1]}>
          {/\[([^\]]*)\]/.exec(part)[1]}
        </a>
      ) : (
        part
      ),
    );

    return output;
  };

  return (
    <>
      <Tabs titles={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 1 && (
        // For some reason if you remove w-100, it wants to be even wider and causes horizontal scrolling :/
        <div className="row w-100 px-2 fs-5">
          <div className="col-md-5">
            <p>
              Type:&#8194;<b>{competition.type === CompetitionType.Meetup ? 'Meetup' : 'Competition'}</b>
            </p>
            <p>Date:&#8194;{formattedDate}</p>
            {formattedTime && <p>Starts at:&#8194;{formattedTime}</p>}
            <p>
              City:&#8194;{competition.city}, <b>{getCountry(competition.countryIso2)}</b>
            </p>
            {competition.venue && <p>Venue:&#8194;{competition.venue}</p>}
            {competition.address && <p>Address:&#8194;{competition.address}</p>}
            {competition.latitudeMicrodegrees && <p>Coordinates:&#8194;{getFormattedCoords(competition)}</p>}
            {competition.contact && <p>Contact:&#8194;{competition.contact}</p>}
            {competition.organizers && <p>Organizers:&#8194;{getFormattedOrganizers()}</p>}
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
                <b>Description:</b>&#8195;{getFormattedDescription()}
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
      {activeTab === 3 && (
        <Schedule
          rooms={competition.compDetails.schedule.venues[0].rooms}
          compEvents={competition.events}
          timezone={competition.compDetails.schedule.venues[0].timezone}
        />
      )}
    </>
  );
};

export default CompetitionResults;
