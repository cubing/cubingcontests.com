import type { EventResponse } from "~/server/db/schema/events.ts";
import RankingRow from "./RankingRow.tsx";

type Props = {
  rankings: IRanking[];
  event: EventResponse;
  // These two parameters are mutually-exclusive
  recordsTable?: boolean;
  topResultsRankings?: boolean;
};

function RankingsTable({ rankings, event, recordsTable = false, topResultsRankings = false }: Props) {
  if (topResultsRankings && recordsTable) {
    throw new Error("forAverage and topResultsRankings cannot both be true in RankingsTable");
  }

  const hasComp = rankings.some((e) => e.contest);
  const hasLink = rankings.some((e) => e.videoLink || e.discussionLink);
  const showAllTeammates = event && event.participants > 1 && topResultsRankings && !recordsTable;
  const showTeamColumn = event && event.participants > 1 && !showAllTeammates && !recordsTable;
  const hasSolves = rankings.some((e) => e.attempts);
  const showDetailsColumn = hasSolves || rankings.some((e) => e.memo);
  let lastRanking = 0;

  if (rankings.length === 0) return <p className="fs-5 mx-2 mt-4">Results not found</p>;

  /////////////////////////////////////////////////////////////////////////////////////////
  // REMEMBER TO UPDATE THE MOBILE VIEW OF THE RECORDS PAGE WHEN CHANGING THIS
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="table-responsive flex-grow-1">
      <table className="table-hover table-responsive table text-nowrap">
        <thead>
          <tr>
            <th>{recordsTable ? "Type" : "#"}</th>
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
            {showDetailsColumn && <th>{hasSolves ? "Solves" : "Memorization time"}</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking) => {
            const isTiedRanking = ranking.ranking === lastRanking;
            lastRanking = ranking.ranking as number;

            if (recordsTable) {
              return ranking.persons.map((person, i) => (
                <RankingRow
                  key={`${ranking.type}_${ranking.resultId}_${person.id}`}
                  onlyKeepPerson={i !== 0}
                  event={event}
                  ranking={ranking}
                  person={person}
                  showAllTeammates={showAllTeammates}
                  showDetailsColumn={showDetailsColumn}
                  forRecordsTable
                />
              ));
            }

            let key = `${ranking.resultId}_${ranking.persons[0].id}`;
            if (ranking.attemptNumber !== undefined) key += `_${ranking.attemptNumber}`;

            return (
              <RankingRow
                key={key}
                isTiedRanking={isTiedRanking}
                event={event}
                ranking={ranking}
                // The backend sets the first person in the array as the person being ranked
                person={ranking.persons[0]}
                showAllTeammates={showAllTeammates}
                showTeamColumn={showTeamColumn}
                showDetailsColumn={showDetailsColumn}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RankingsTable;
