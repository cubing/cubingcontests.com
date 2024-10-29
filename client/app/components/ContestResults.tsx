'use client';

import { useSearchParams } from 'next/navigation';
import EventResultsTable from '~/app/components/EventResultsTable.tsx';
import EventButtons from '~/app/components/EventButtons.tsx';
import { IContest, IContestDto, IPerson, IRecordType } from '~/shared_helpers/types.ts';

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
  const eventId = searchParams.get('eventId') ?? contest.events[0].event.eventId;
  const contestEvent = contest.events.find((ce) => ce.event.eventId === eventId);

  if (!contestEvent) throw new Error(`Contest event with event ID ${eventId} not found`);

  return (
    <div>
      <div className='px-1'>
        <EventButtons eventId={eventId} events={events} forPage='results' />
      </div>
      <EventResultsTable contestEvent={contestEvent} persons={persons} recordTypes={activeRecordTypes} />
    </div>
  );
};

export default ContestResults;
