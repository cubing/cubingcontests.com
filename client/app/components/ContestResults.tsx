'use client';

import { useSearchParams } from 'next/navigation';
import EventResultsTable from '@c/EventResultsTable';
import EventButtons from '@c/EventButtons';
import { IContest, IContestDto, IPerson, IRecordType } from '@sh/types';

const ContestResults = ({
  contest,
  persons,
  activeRecordTypes,
}: {
  contest: IContest | IContestDto;
  persons: IPerson[];
  activeRecordTypes: IRecordType[];
}) => {
  const searchParams = useSearchParams();

  const events = contest.events.map((el) => el.event);
  const eventId = searchParams.get('eventId');
  const contestEvent = eventId ? contest.events.find((ce) => ce.event.eventId === eventId) : contest.events[0];

  return (
    <div>
      <div className="px-1">
        <EventButtons eventId={eventId} events={events} forPage="results" />
      </div>
      <EventResultsTable contestEvent={contestEvent} persons={persons} recordTypes={activeRecordTypes} />
    </div>
  );
};

export default ContestResults;
