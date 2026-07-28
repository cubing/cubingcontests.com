"use client";

import { use } from "react";
import RankingRow from "~/app/[slug]/rankings/[eventId]/[type]/RankingRow.tsx";
import type { Ranking } from "~/helpers/types/Rankings.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  rankingsPromise: Promise<Ranking[]>;
  event: EventResponseWithCategory;
  regions: RegionResponse[];
  type: "single" | "average" | "all-avg-formats";
  show?: "results";
};

function RankingsTable({ rankingsPromise, event, regions, type, show }: Props) {
  const rankings = use(rankingsPromise);

  const hasComp = rankings.some((r) => r.contest);
  const hasLink = rankings.some((r) => r.videoLink || r.discussionLink);
  const showAllTeammates = event && event.participants > 1 && show === "results";
  const showTeamColumn = event && event.participants > 1 && !showAllTeammates;
  const showDetailsColumn = type !== "single" || rankings.some((e) => e.memo);

  return (
    <div className="table-responsive flex-grow-1">
      <table className="table-hover table-responsive table text-nowrap">
        <thead>
          <tr>
            <th>#</th>
            <th>{!showAllTeammates ? "Name" : "Team"}</th>
            <th>Result</th>
            {!showAllTeammates && <th>Representing</th>}
            <th>Date</th>
            <th>
              {hasComp ? "Contest" : ""}
              {hasComp && hasLink ? " / " : ""}
              {hasLink ? "Links" : ""}
            </th>
            {showTeamColumn && <th>Team</th>}
            {showDetailsColumn && <th>Details</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking, i) => (
            <RankingRow
              key={ranking.rankingId}
              type={type === "single" ? "single" : "average"}
              ranking={ranking}
              isTiedRanking={ranking.ranking !== i + 1}
              event={event}
              regions={regions}
              showAllTeammates={showAllTeammates}
              showTeamColumn={showTeamColumn}
              showDetailsColumn={showDetailsColumn}
            />
          ))}
        </tbody>
      </table>
      {rankings.length === 0 && <p className="fs-5 mx-2 mt-4">No rankings found matching the requested parameters</p>}
    </div>
  );
}

export default RankingsTable;
