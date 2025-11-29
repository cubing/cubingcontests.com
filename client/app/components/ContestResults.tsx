import EventButtons from "~/app/components/EventButtons.tsx";
import EventResultsTable from "~/app/components/EventResultsTable.tsx";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { ResultResponse } from "~/server/db/schema/results.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";

type Props = {
  eventId: string;
  events: EventResponse[];
  rounds: RoundResponse[];
  results: ResultResponse[];
  persons: PersonResponse[];
  recordConfigs: RecordConfigResponse[];
};

function ContestResults({ eventId, events, rounds, results, persons, recordConfigs }: Props) {
  const event = events.find((e) => e.eventId === eventId);

  if (!event) throw new Error(`Contest event with event ID ${eventId} not found`);

  return (
    <div>
      <div className="px-1">
        <EventButtons eventId={eventId} events={events} forPage="results" />
      </div>
      <EventResultsTable
        event={event}
        rounds={rounds}
        results={results}
        persons={persons}
        recordConfigs={recordConfigs}
      />
    </div>
  );
}

export default ContestResults;
