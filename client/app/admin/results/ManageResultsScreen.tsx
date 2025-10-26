"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { getFormattedDate, shortenEventName } from "~/helpers/utilityFunctions.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Time from "~/app/components/Time.tsx";
import Solves from "~/app/components/Solves.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import { InputPerson } from "~/helpers/types.ts";
import Button from "~/app/components/UI/Button.tsx";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import type { FullResult } from "~/server/db/schema/results.ts";

type Props = {
  results: FullResult[];
  activeRecordConfigs: RecordConfigResponse[];
};

function ManageResultsScreen({ results, activeRecordConfigs }: Props) {
  const parentRef = useRef<Element>(null);

  const [persons, setPersons] = useState<InputPerson[]>([null]);
  const [personNames, setPersonNames] = useState([""]);

  const filteredResults = useMemo(() =>
    results.filter((r) => {
      const passesCompetitorFilter = !persons[0] || r.personIds.includes(persons[0].personId);
      return passesCompetitorFilter;
    }), [results, persons]);

  const rowVirtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 43.4167, // UPDATE THIS IF THE TR HEIGHT IN PIXELS EVER CHANGES!
    overscan: 20,
  });

  const resetFilters = () => {
    setPersons([null]);
    setPersonNames([""]);
  };

  return (
    <>
      <ToastMessages />

      <FiltersContainer>
        <FormPersonInputs
          title="Competitor"
          persons={persons}
          setPersons={setPersons}
          personNames={personNames}
          setPersonNames={setPersonNames}
          disabled={results.length === 0}
          addNewPersonMode="disabled"
          display="one-line"
        />
        {persons.at(0) && <Button onClick={resetFilters} className="btn btn-secondary btn-md">Reset</Button>}
      </FiltersContainer>

      <p className="px-3">
        Number of video-based results:&nbsp;<b>{filteredResults.length}</b>
        &#8194;|&#8194;Not approved:&nbsp;
        <b>{filteredResults.filter((r) => !r.approved).length}</b>
      </p>

      <div
        ref={parentRef as any}
        className="mt-3 table-responsive overflow-y-auto"
        style={{ height: "700px" }}
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <table className="table table-hover text-nowrap">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Competitors</th>
                <th scope="col">Best</th>
                <th scope="col">Average</th>
                <th scope="col">Attempts</th>
                <th scope="col">Date</th>
                <th scope="col">Approved</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualItem, index) => {
                if (filteredResults?.length === 0) return;
                const result = filteredResults[virtualItem.index];

                return (
                  <tr
                    key={virtualItem.key as React.Key}
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                    }}
                  >
                    <td>
                      {result.event ? shortenEventName(result.event.name) : "EVENT NOT FOUND"}
                    </td>
                    <td>
                      {result.persons.length > 0 ? <Competitors persons={result.persons} vertical /> : (
                        "COMPETITOR(S) NOT FOUND"
                      )}
                    </td>
                    <td>
                      <Time
                        result={result}
                        event={result.event}
                        recordConfigs={activeRecordConfigs}
                      />
                    </td>
                    <td>
                      {result.attempts.length >= 3 && (
                        <Time
                          result={result}
                          event={result.event}
                          recordConfigs={activeRecordConfigs}
                          average
                        />
                      )}
                    </td>
                    <td>
                      <Solves event={result.event} attempts={result.attempts} />
                    </td>
                    <td>{getFormattedDate(result.date)}</td>
                    <td>
                      {result.approved
                        ? <span className="badge bg-success">Yes</span>
                        : <span className="badge bg-danger">No</span>}
                    </td>
                    <td>
                      <Link
                        href={`/admin/results/${(result as any)._id}`}
                        prefetch={false}
                        className="btn btn-primary btn-xs"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default ManageResultsScreen;
