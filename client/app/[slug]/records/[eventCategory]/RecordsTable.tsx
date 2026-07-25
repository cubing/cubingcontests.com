"use client";

import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { use } from "react";
import RecordRow from "~/app/[slug]/records/[eventCategory]/RecordRow.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import type { RecordRanking } from "~/helpers/types/Rankings.tsx";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  recordsPromise: Promise<RecordRanking[]>;
  events: Pick<EventResponse, "eventId" | "name" | "category" | "format" | "description">[];
  regions: RegionResponse[];
};

function RecordsTable({ recordsPromise, events, regions }: Props) {
  const records = use(recordsPromise);
  const { slug }: { slug: string } = useParams();

  const [category] = useQueryState("category");
  const [eventId] = useQueryState("eventId");

  return (
    <div className="mt-4">
      {records.length === 0 ? (
        <p className="fs-5 mx-2">No records have been set yet</p>
      ) : (
        events
          .filter((e) => records.some((r) => r.eventId === e.eventId))
          .map((event) => {
            let eventRecords: RecordRanking[] = [];
            // If we're filtering by a specific event, we want to display the whole record history for the event
            const mixedRecords = !!eventId;

            const getCurrentTiedRecords = (type: "single" | "average") => {
              let currentRecordResult: number | undefined;

              for (const record of records) {
                if (record.eventId === event.eventId && (record.type === "single-and-avg" || record.type === type)) {
                  const result = type === "single" ? record.best : record.average;
                  if (!currentRecordResult) currentRecordResult = result;
                  else if (result > currentRecordResult) break;

                  eventRecords.push({
                    ...record,
                    rankingId: record.rankingId.replace(/_.*$/, `_${type}`),
                    type,
                  });
                }
              }
            };

            if (mixedRecords) {
              eventRecords = records;
            } else {
              getCurrentTiedRecords("single");
              getCurrentTiedRecords("average");
            }

            return (
              <div key={event.eventId} className="mb-3">
                <EventTitle
                  organizationSlug={slug}
                  event={event}
                  showIcon
                  linkToRankings={category ? `?category=${category}` : true}
                  showDescription
                />

                <div className="table-responsive flex-grow-1">
                  <table className="table-hover table-responsive table text-nowrap">
                    <thead>
                      <tr>
                        <th>{mixedRecords ? "Date" : "Type"}</th>
                        <th>Name</th>
                        <th>{mixedRecords ? "Best" : "Result"}</th>
                        {mixedRecords && <th>Average</th>}
                        {!mixedRecords && <th>Representing</th>}
                        {!mixedRecords && <th>Date</th>}
                        <th>{category === "online" ? "Link" : "Contest"}</th>
                        <th>Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRecords.map((record) =>
                        mixedRecords ? (
                          <RecordRow
                            key={record.rankingId}
                            type={record.type}
                            record={record}
                            event={event}
                            regions={regions}
                            mixedRecords
                          />
                        ) : (
                          record.persons.map((person, i) => (
                            <RecordRow
                              key={`${record.rankingId}_${person.id}`}
                              type={record.type}
                              record={record}
                              event={event}
                              regions={regions}
                              showOnlyPersonWithId={i}
                            />
                          ))
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}

export default RecordsTable;
