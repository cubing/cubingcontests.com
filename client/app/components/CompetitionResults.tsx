'use client';

import { useState, useMemo, useEffect } from 'react';
import { utcToZonedTime, format } from 'date-fns-tz';
import Tabs from './Tabs';
import ContestTypeBadge from './ContestTypeBadge';
import EventResultsTable from './EventResults';
import Schedule from './Schedule';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces';
import { CompetitionState, CompetitionType } from '@sh/enums';
import { getCountry, getFormattedDate, getFormattedCoords } from '~/helpers/utilityFunctions';
import { areIntervalsOverlapping, endOfToday, startOfToday } from 'date-fns';
import { competitionTypeOptions } from '~/helpers/multipleChoiceOptions';
import EventButtons from './EventButtons';

const getTabNumber = (hash: string): number => {
  switch (hash) {
    case '#Results':
      return 1;
    case '#Schedule':
      return 2;
    default:
      return 0;
  }
};

const getHashFromTab = (tab: number): string => {
  switch (tab) {
    case 1:
      return '#Results';
    case 2:
      return '#Schedule';
    default:
      return '';
  }
};

const CompetitionResults = ({ data: { competition, persons, activeRecordTypes } }: { data: ICompetitionData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<ICompetitionEvent>(competition.events[0]);

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
  // Not used for competitions
  const formattedTime = useMemo(() => {
    if (competition.type === CompetitionType.Competition) return null;
    return format(utcToZonedTime(competition.startDate, competition.timezone || 'UTC'), 'H:mm');
  }, [competition]);
  const events = useMemo(() => competition.events.map((el) => el.event), [competition.events]);

  const competitionType = competitionTypeOptions.find((el) => el.value === competition.type)?.label || 'ERROR';
  const isOngoing =
    competition.state < CompetitionState.Finished &&
    areIntervalsOverlapping(
      { start: new Date(competition.startDate), end: new Date(competition.endDate || competition.startDate) },
      { start: startOfToday(), end: endOfToday() },
      { inclusive: true },
    );

  useEffect(() => {
    // If hash is not empty, set initial tab number
    if (window.location.hash.replace('#', '')) {
      setActiveTab(getTabNumber(window.location.hash));
    }
  }, []);

  const changeActiveTab = (newTab: number) => {
    setActiveTab(newTab);
    window.location.replace(getHashFromTab(newTab));
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

  const selectEvent = (eventId: string) => {
    setSelectedEvent(competition.events.find((el) => el.event.eventId === eventId));
  };

  return (
    <>
      <Tabs titles={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

      {activeTab === 0 && (
        // For some reason if you remove w-100, it wants to be even wider and causes horizontal scrolling :/
        <div className="row w-100 mb-4 px-2 fs-5">
          <div className="col-md-5">
            <div className="mb-2">
              <ContestTypeBadge type={competition.type} />
            </div>
            <p className="mb-2">Date:&#8194;{formattedDate}</p>
            {formattedTime && (
              <p>
                Starts at:&#8194;{formattedTime}
                {competition.type === CompetitionType.Online ? ' (UTC)' : ''}
              </p>
            )}
            {competition.type !== CompetitionType.Online && (
              <p className="mb-2">
                City:&#8194;{competition.city}, <b>{getCountry(competition.countryIso2)}</b>
              </p>
            )}
            {competition.venue && <p className="mb-2">Venue:&#8194;{competition.venue}</p>}
            {competition.address && <p className="mb-2">Address:&#8194;{competition.address}</p>}
            {competition.latitudeMicrodegrees && competition.longitudeMicrodegrees && (
              <p className="mb-2">Coordinates:&#8194;{getFormattedCoords(competition)}</p>
            )}
            {competition.contact && <p className="mb-2">Contact:&#8194;{competition.contact}</p>}
            <p className="mb-2">
              {competition.organizers.length > 1 ? 'Organizers' : 'Organizer'}:&#8194;{getFormattedOrganizers()}
            </p>
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
            {isOngoing && <p className="mb-4">This contest is currently ongoing</p>}
            {competition.state === CompetitionState.Finished && (
              <p className="mb-4">The results for this {competitionType.toLowerCase()} are currently being checked</p>
            )}
            {competition.description && (
              <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
                <b>Description:</b>&#8195;{getFormattedDescription()}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <>
          <EventButtons events={events} activeEvent={selectedEvent.event} onEventSelect={selectEvent} hideCategories />
          <EventResultsTable compEvent={selectedEvent} persons={persons} recordTypes={activeRecordTypes} />
        </>
      )}
      {activeTab === 2 && (
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
