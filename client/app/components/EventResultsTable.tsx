"use client";

import RoundResultsTable from "./RoundResultsTable.tsx";
import { IContestEvent, IPerson, IRecordType, type IRound } from "~/helpers/types.ts";
import { useEffect, useState } from "react";
import { roundTypes } from "~/helpers/roundTypes.ts";
import EventTitle from "./EventTitle.tsx";
import FormSelect from "./form/FormSelect.tsx";

const EventResultsTable = ({
  contestEvent,
  persons,
  recordTypes,
  onDeleteResult,
}: {
  contestEvent: IContestEvent;
  persons: IPerson[];
  recordTypes: IRecordType[];
  onDeleteResult?: (resultId: string) => void;
}) => {
  // Display finals by default
  const [currRound, setCurrRound] = useState<IRound>(contestEvent.rounds[contestEvent.rounds.length - 1]);

  useEffect(() => {
    setCurrRound(contestEvent.rounds[contestEvent.rounds.length - 1]);
  }, [contestEvent]);

  return (
    <div className="my-3">
      <div className="mb-4">
        <EventTitle event={contestEvent.event} linkToRankings showDescription />
      </div>

      {contestEvent.rounds.length > 1 && (
        <div className="mb-4 px-2" style={{ maxWidth: "450px" }}>
          <FormSelect
            options={contestEvent.rounds.map((el) => ({
              label: roundTypes[el.roundTypeId].label,
              value: el.roundTypeId,
            }))}
            selected={currRound.roundTypeId}
            setSelected={(val) => setCurrRound(contestEvent.rounds.find((r) => r.roundTypeId === val) as IRound)}
          />
        </div>
      )}

      <RoundResultsTable
        round={currRound}
        event={contestEvent.event}
        persons={persons}
        recordTypes={recordTypes}
        onDeleteResult={onDeleteResult}
      />
    </div>
  );
};

export default EventResultsTable;
