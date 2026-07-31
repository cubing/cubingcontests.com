"use client";

import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import Attempts from "~/app/components/Attempts.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import RankingLinks from "~/app/components/RankingLinks.tsx";
import Region from "~/app/components/Region.tsx";
import type { Ranking } from "~/helpers/types/Rankings.ts";
import { getAlwaysShowDecimals, getFormattedDate, getFormattedTime, slugPath } from "~/helpers/utility-functions.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  event: Pick<EventResponseWithCategory, "name" | "format" | "category">;
  regions: RegionResponse[];
  type: "single" | "average";
  ranking: Ranking;
  isTiedRanking: boolean;
  showAllTeammates: boolean;
  showTeamColumn: boolean;
  showDetailsColumn: boolean;
};

function RankingRow({
  type,
  ranking,
  isTiedRanking,
  event,
  regions,
  showAllTeammates = false,
  showTeamColumn = false,
  showDetailsColumn = false,
}: Props) {
  const { slug }: { slug: string } = useParams();

  const [expanded, setExpanded] = useState(false);

  const personsToDisplay = showAllTeammates
    ? ranking.persons
    : [ranking.personId ? ranking.persons.find((p) => p.id === ranking.personId)! : ranking.persons[0]];
  const result = getFormattedTime(ranking.result, {
    eventFormat: event.format,
    showDecimals: getAlwaysShowDecimals(event) ? "up-to-1h" : "default",
    showMultiPoints: true,
    isAverage: type === "average",
  });

  return (
    <tr style={expanded ? { borderBottom: "#212529" } : {}}>
      <td>
        <span className={isTiedRanking ? "text-secondary" : ""}>{ranking.ranking}</span>
      </td>
      <td>
        <Competitors persons={personsToDisplay} regions={regions} noFlag={!showAllTeammates} />
      </td>
      <td>{result}</td>
      {!showAllTeammates && (
        <td>
          <Region regionCode={personsToDisplay[0].regionCode} regions={regions} shorten />
        </td>
      )}
      <td>{getFormattedDate(ranking.date)}</td>
      <td>
        {ranking.contest ? (
          <span className="d-flex gap-2 align-items-center">
            <Region regionCode={ranking.contest.regionCode} regions={regions} noText />

            <Link href={slugPath(slug, `/competitions/${ranking.contest.competitionId}`)} prefetch={false}>
              {ranking.contest.shortName}
            </Link>
          </span>
        ) : (
          <RankingLinks ranking={ranking} />
        )}
      </td>
      {showTeamColumn && (
        <td>
          <div className="d-flex fs-6 flex-column gap-2">
            <span className="align-self-end">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? "Collapse" : "Expand"}
                className="fs-5 border-0 bg-transparent p-0"
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
              </button>
            </span>

            {expanded && ranking.persons.map((p) => <Competitor key={p.id} person={p} regions={regions} />)}
          </div>
        </td>
      )}
      {showDetailsColumn && (
        <td>
          {type === "average" ? (
            <Attempts event={event} attempts={ranking.attempts} showMultiPoints />
          ) : (
            ranking.memo && `${getFormattedTime(ranking.memo, { showDecimals: "never" })} memo`
          )}
        </td>
      )}
    </tr>
  );

  // {expanded && (
  //   <tr>
  //     <td colSpan={7} className="p-3">
  //       <div className="d-flex gap-4">
  //         <div className="d-flex flex-shrink-0 gap-4 rounded-4 bg-body-secondary p-4 align-items-center">
  //           <div className="d-flex justify-content-center flex-shrink-0 overflow-hidden rounded-circle border border-secondary bg-body-tertiary align-items-center">
  //             <img src="/vimilyn.png" alt={ranking.persons[0].name} height="100px" width="100px" />
  //           </div>
  //           <div>
  //             <h3>{ranking.persons[0].name}</h3>
  //             <div className="d-flex gap-4">
  //               <div>
  //                 <span className="small text-muted">RANK</span>
  //                 <div className="fw-bold fs-4">#1</div>
  //               </div>
  //               <div>
  //                 <span className="small text-muted">POINTS</span>
  //                 <div className="fw-bold fs-4">{result}</div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         <div className="flex-grow-1">
  //           <div className="row mb-3">
  //             <div className="col">
  //               <div className="d-flex gap-3 rounded-3 border border-secondary p-3">
  //                 <div className="fs-5 rounded-3 bg-body-secondary p-2 text-primary">
  //                   <FontAwesomeIcon icon={faUser} />
  //                 </div>
  //                 <div>
  //                   <div className="small text-muted">GENDER</div>
  //                   <div className="fw-bold">Female</div>
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="col">
  //               <div className="d-flex gap-3 rounded-3 border border-secondary p-3">
  //                 <div className="fs-5 rounded-3 bg-body-secondary p-2 text-primary">
  //                   <FontAwesomeIcon icon={faCakeCandles} />
  //                 </div>
  //                 <div>
  //                   <div className="small text-muted">AGE</div>
  //                   <div className="fw-bold">23 years</div>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //           <div className="row">
  //             <div className="col">
  //               <div className="d-flex gap-3 rounded-3 border border-secondary p-3">
  //                 <div className="fs-5 rounded-3 bg-body-secondary p-2 text-primary">
  //                   <FontAwesomeIcon icon={faFlag} />
  //                 </div>
  //                 <div>
  //                   <div className="small text-muted">COUNTRY</div>
  //                   <div className="fw-bold">Singapore</div>
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="col">
  //               <div className="d-flex gap-3 rounded-3 border border-secondary p-3">
  //                 <div className="fs-5 rounded-3 bg-body-secondary p-2 text-primary">
  //                   <FontAwesomeIcon icon={faTrophy} />
  //                 </div>
  //                 <div>
  //                   <div className="small text-muted">NATIONAL RANK</div>
  //                   <div className="fw-bold">#1</div>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //       <button type="button" className="btn btn-primary d-block ms-auto mt-3">
  //         <FontAwesomeIcon icon={faArrowTrendUp} className="me-2" />
  //         View Full Ranking Details
  //       </button>
  //     </td>
  //   </tr>
  // )}
}

export default RankingRow;
