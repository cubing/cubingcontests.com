'use client';

import { useState } from 'react';
import EventResultsTable from '@c/EventResultsTable';
import EventButtons from '@c/EventButtons';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces';

const CompetitionResults = ({
  competitionData: { competition, persons, activeRecordTypes },
}: {
  competitionData: ICompetitionData;
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ICompetitionEvent>(competition.events[0]);

  const events = competition.events.map((el) => el.event);

  const selectEvent = (eventId: string) => {
    setSelectedEvent(competition.events.find((el) => el.event.eventId === eventId));
  };

  return (
    <>
      <EventButtons events={events} activeEvent={selectedEvent.event} onEventSelect={selectEvent} hideCategories />
      <EventResultsTable compEvent={selectedEvent} persons={persons} recordTypes={activeRecordTypes} />
    </>
  );
};

export default CompetitionResults;
