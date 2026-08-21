"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { roundTypes } from "~/helpers/roundTypes.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { ResultResponse } from "~/server/db/schema/results.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";
import EventTitle from "./EventTitle.tsx";
import FormSelect from "./form/FormSelect.tsx";
import RoundResultsTable from "./RoundResultsTable.tsx";

type Props = {
  event: EventResponseWithCategory;
  rounds: RoundResponse[];
  results: ResultResponse[];
  persons: PersonResponse[];
  recordConfigs: RecordConfigResponse[];
};

function EventResultsTable({ event, rounds, results, persons, recordConfigs }: Props) {
  const { slug }: { slug: string } = useParams();

  // Display finals by default
  const [currRound, setCurrRound] = useState(rounds.at(-1)!);

  const roundResults = useMemo(
    () => results.filter((r) => r.roundId === currRound.id).sort((a, b) => a.ranking! - b.ranking!),
    [results, currRound],
  );

  const roundOptions = rounds.map((r) => ({ label: roundTypes[r.roundTypeId].label, value: r.roundTypeId }));

  useEffect(() => {
    setCurrRound(rounds.at(-1)!);
  }, [rounds]);

  return (
    <div className="my-3">
      <div className="mb-4">
        <EventTitle organizationSlug={slug} event={event} linkToRankings showDescription />
      </div>

      {rounds.length > 1 && (
        <div className="mb-4 px-2" style={{ maxWidth: "450px" }}>
          <FormSelect
            options={roundOptions}
            selected={currRound.roundTypeId}
            setSelected={(val) => setCurrRound(rounds.find((r) => r.roundTypeId === val)!)}
          />
        </div>
      )}

      <RoundResultsTable
        event={event}
        round={currRound}
        results={roundResults}
        persons={persons}
        recordConfigs={recordConfigs}
      />
    </div>
  );
}

export default EventResultsTable;
