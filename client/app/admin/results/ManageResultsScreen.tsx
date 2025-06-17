"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { useMyFetch } from "~/helpers/customHooks.ts";
import { IFeResult, IRecordType } from "~/helpers/types.ts";
import { getFormattedDate, shortenEventName } from "~/helpers/utilityFunctions.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Time from "~/app/components/Time.tsx";
import Solves from "~/app/components/Solves.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import FormPersonInputs from "~/app/components/form/FormPersonInputs";
import FiltersContainer from "~/app/components/FiltersContainer";
import { InputPerson } from "~/helpers/types";
import Button from "~/app/components/UI/Button";

const ManageResultsScreen = ({ recordTypes }: { recordTypes: IRecordType[] }) => {
  const myFetch = useMyFetch();
  const parentRef = useRef<Element>(null);

  const [results, setResults] = useState<IFeResult[]>([]);
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

  useEffect(() => {
    myFetch.get("/results/video-based", { authorize: true }).then((res) => {
      if (res.success) setResults(res.data);
    });
  }, []);

  const resetFilters = () => {
    setPersons([null]);
    setPersonNames([""]);
  };

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>
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
        &#8194;|&#8194;Unapproved:&nbsp;
        <b>{filteredResults.filter((r: IFeResult) => r.unapproved).length}</b>
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
                        "COMPETITOR NOT FOUND"
                      )}
                    </td>
                    <td>
                      <Time
                        result={result}
                        event={result.event}
                        recordTypes={recordTypes}
                      />
                    </td>
                    <td>
                      {result.attempts.length >= 3 && (
                        <Time
                          result={result}
                          event={result.event}
                          recordTypes={recordTypes}
                          average
                        />
                      )}
                    </td>
                    <td>
                      <Solves event={result.event} attempts={result.attempts} />
                    </td>
                    <td>{getFormattedDate(result.date)}</td>
                    <td>
                      {result.unapproved
                        ? <span className="badge bg-danger">No</span>
                        : <span className="badge bg-success">Yes</span>}
                    </td>
                    <td>
                      <Link
                        href={`/admin/results/${(result as any)._id}`}
                        prefetch={false}
                        className="btn btn-primary btn-xs"
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
    </section>
  );
};

export default ManageResultsScreen;
