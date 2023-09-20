'use client';

import { useState } from 'react';
import EventResultsTable from '@c/EventResultsTable';
import EventButtons from '@c/EventButtons';
import { IContestData, IContestEvent } from '@sh/interfaces';

const ContestResults = ({ contestData: { contest, persons, activeRecordTypes } }: { contestData: IContestData }) => {
  const [selectedEvent, setSelectedEvent] = useState<IContestEvent>(contest.events[0]);

  const events = contest.events.map((el) => el.event);

  const selectEvent = (eventId: string) => {
    setSelectedEvent(contest.events.find((el) => el.event.eventId === eventId));
  };

  return (
    <>
      <EventButtons events={events} activeEvent={selectedEvent.event} onEventSelect={selectEvent} hideCategories />
      <EventResultsTable contestEvent={selectedEvent} persons={persons} recordTypes={activeRecordTypes} />
    </>
  );
};

export default ContestResults;
