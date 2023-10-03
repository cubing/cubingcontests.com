'use client';

import { useState } from 'react';
import EventResultsTable from '@c/EventResultsTable';
import EventButtons from '@c/EventButtons';
import { IContest, IContestEvent, IPerson, IRecordType } from '@sh/interfaces';

const ContestResults = ({
  contest,
  persons,
  activeRecordTypes = [],
}: {
  contest: IContest;
  persons: IPerson[];
  activeRecordTypes?: IRecordType[];
}) => {
  const [selectedEvent, setSelectedEvent] = useState<IContestEvent>(contest.events[0]);

  const events = contest.events.map((el) => el.event);

  const selectEvent = (eventId: string) => {
    setSelectedEvent(contest.events.find((el) => el.event.eventId === eventId));
  };

  return (
    <div>
      <div className="px-1">
        <EventButtons events={events} activeEvent={selectedEvent.event} onEventSelect={selectEvent} />
      </div>
      <EventResultsTable contestEvent={selectedEvent} persons={persons} recordTypes={activeRecordTypes} />
    </div>
  );
};

export default ContestResults;
