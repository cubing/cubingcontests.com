'use client';

import { useState, useMemo, useEffect } from 'react';
import { utcToZonedTime, format } from 'date-fns-tz';
import EventResultsTable from './EventResults';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces';
import { getCountry, getFormattedDate, getFormattedCoords } from '~/helpers/utilityFunctions';
import { CompetitionState, CompetitionType } from '@sh/enums';
import Tabs from './Tabs';
import Schedule from './Schedule';

const getTabNumber = (hash: string): number => {
  switch (hash) {
    case '#Results':
      return 2;
    case '#Schedule':
      return 3;
    default:
      return 1;
  }
};

const getHashFromTab = (tab: number): string => {
  switch (tab) {
    case 2:
      return 'Results';
    case 3:
      return 'Schedule';
    default:
      return '';
  }
};

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

  useEffect(() => {
    // If hash is not empty, set initial tab number
    if (window.location.hash.replace('#', '')) {
      setActiveTab(getTabNumber(window.location.hash));
    }
  }, []);

  const changeActiveTab = (newTab: number) => {
    setActiveTab(newTab);
    window.location.hash = getHashFromTab(newTab);
  };

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
      <Tabs titles={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

      {activeTab === 1 && (
        // For some reason if you remove w-100, it wants to be even wider and causes horizontal scrolling :/
        <div className="row w-100 mb-4 px-2 fs-5">
          <div className="col-md-5">
            <p className="mb-2">
              Type:&#8194;<b>{competition.type === CompetitionType.Meetup ? 'Meetup' : 'Competition'}</b>
            </p>
            <p className="mb-2">Date:&#8194;{formattedDate}</p>
            {formattedTime && <p>Starts at:&#8194;{formattedTime}</p>}
            <p className="mb-2">
              City:&#8194;{competition.city}, <b>{getCountry(competition.countryIso2)}</b>
            </p>
            {competition.venue && <p className="mb-2">Venue:&#8194;{competition.venue}</p>}
            {competition.address && <p className="mb-2">Address:&#8194;{competition.address}</p>}
            {competition.latitudeMicrodegrees && competition.longitudeMicrodegrees && (
              <p className="mb-2">Coordinates:&#8194;{getFormattedCoords(competition)}</p>
            )}
            {competition.contact && <p className="mb-2">Contact:&#8194;{competition.contact}</p>}
            {competition.organizers && <p className="mb-2">Organizers:&#8194;{getFormattedOrganizers()}</p>}
            {competition.state < CompetitionState.Published && competition.competitorLimit && (
              <p className="mb-2">
                Competitor limit:&#8194;<b>{competition.competitorLimit}</b>
              </p>
            )}
            {competition.participants > 0 && (
              <p className="mb-2">
                Number of participants:&#8194;<b>{competition.participants}</b>
              </p>
            )}
          </div>
          <hr className="d-md-none mt-2 mb-3" />
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
