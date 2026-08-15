"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Attempts from "~/app/components/Attempts.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import RankingLinks from "~/app/components/RankingLinks.tsx";
import Region from "~/app/components/Region.tsx";
import type { RecordRanking } from "~/helpers/types/Rankings.ts";
import { getAlwaysShowDecimals, getFormattedDate, getFormattedResult, slugPath } from "~/helpers/utility-functions.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  event: Pick<EventResponseWithCategory, "name" | "format" | "category">;
  regions: RegionResponse[];
  type: "single" | "average" | "single-and-avg";
  record: RecordRanking;
  mixedRecords?: boolean;
  showOnlyPersonWithId?: number;
};

function RecordRow({ type, record, event, regions, mixedRecords, showOnlyPersonWithId }: Props) {
  const { slug }: { slug: string } = useParams();

  const date = getFormattedDate(record.date);
  const personsToDisplay = showOnlyPersonWithId === undefined ? record.persons : [record.persons[showOnlyPersonWithId]];

  return (
    <tr>
      <td>
        {!showOnlyPersonWithId &&
          (mixedRecords ? (
            date
          ) : (
            <span>{type === "single" ? "Single" : record.attempts.length === 3 ? "Mean" : "Average"}</span>
          ))}
      </td>
      <td>
        <Competitors persons={personsToDisplay} regions={regions} noFlag={!mixedRecords} />
      </td>
      <td>
        {!showOnlyPersonWithId &&
          (["single", "single-and-avg"].includes(type) || !mixedRecords) &&
          getFormattedResult(type === "average" ? record.average : record.best, {
            eventFormat: event.format,
            showDecimals: getAlwaysShowDecimals(event) ? "up-to-1h" : "default",
            isAverage: type === "average",
          })}
      </td>
      {mixedRecords && (
        <td>
          {["average", "single-and-avg"].includes(type) &&
            getFormattedResult(record.average, { eventFormat: event.format, isAverage: true })}
        </td>
      )}
      {!mixedRecords && (
        <td>
          <Region regionCode={personsToDisplay[0].regionCode} regions={regions} shorten />
        </td>
      )}
      {!mixedRecords && <td>{!showOnlyPersonWithId && date}</td>}
      <td>
        {!showOnlyPersonWithId &&
          (record.contest ? (
            <span className="d-flex gap-2 align-items-center">
              <Region regionCode={record.contest.regionCode} regions={regions} noText />

              <Link href={slugPath(slug, `/competitions/${record.contest.competitionId}`)} prefetch={false}>
                {record.contest.shortName}
              </Link>
            </span>
          ) : (
            <RankingLinks ranking={record} />
          ))}
      </td>
      <td>{!showOnlyPersonWithId && type !== "single" && <Attempts event={event} attempts={record.attempts} />}</td>
    </tr>
  );
}

export default RecordRow;
