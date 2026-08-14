"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams } from "next/navigation";
import { use } from "react";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Region from "~/app/components/Region.tsx";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import { getFormattedDate, slugPath } from "~/helpers/utility-functions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  contestsPromise: Promise<
    Pick<
      ContestResponse,
      "competitionId" | "shortName" | "type" | "city" | "regionCode" | "startDate" | "endDate" | "participants"
    >[]
  >;
  regions: RegionResponse[];
};

function ContestsTable({ contestsPromise, regions }: Props) {
  const contests = use(contestsPromise);
  const { slug }: { slug: string } = useParams();

  if (contests.length === 0) return <p className="fs-5 mx-3">No contests have been held yet</p>;

  return (
    <>
      {/* MOBILE VIEW */}

      <div className="d-block d-lg-none border-bottom border-top">
        <ul className="list-group list-group-flush">
          {contests.map((contest, index) => {
            const contestType = contestTypeOptions.find((ct) => ct.value === contest.type);

            return (
              <li
                key={contest.competitionId}
                className={`list-group-item ps-2 ${index % 2 === 1 ? "list-group-item-secondary" : ""}`}
              >
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  <div className="d-flex gap-2 align-items-center">
                    <span
                      className={`d-shrink-0 tw:text-xs ${contest.type === "comp" ? "tw:icon-[tabler--square-filled]" : contest.type === "meetup" ? "tw:icon-[tabler--flare-filled] tw:text-sm!" : contest.type === "online" ? "tw:icon-[tabler--triangle-filled]" : "tw:icon-[tabler--circle-filled]"}`}
                      style={{ color: contestType?.color }}
                      title={contestType?.label}
                    />

                    <Link
                      href={slugPath(slug, `/competitions/${contest.competitionId}`)}
                      prefetch={false}
                      className="link-primary"
                    >
                      {contest.shortName}
                    </Link>
                  </div>

                  <p className="ms-2 mb-0 text-end">
                    <b>{getFormattedDate(contest.startDate, contest.endDate)}</b>
                  </p>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <div className="ms-2">
                    <span>
                      {contest.city}, <Region regionCode={contest.regionCode} regions={regions} swapPositions shorten />
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-end">
                    {contest.participants > 0 && (
                      <span>
                        Participants: <b>{contest.participants}</b>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* DESKTOP VIEW */}

      <div className="d-none d-lg-block table-responsive mb-5">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">
                <span title="Number of participants">
                  <FontAwesomeIcon icon={faUsers} aria-label="Number of participants" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr key={contest.competitionId}>
                <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                <td>
                  <Link
                    href={slugPath(slug, `/competitions/${contest.competitionId}`)}
                    prefetch={false}
                    className="link-primary"
                  >
                    {contest.shortName}
                  </Link>
                </td>
                <td>
                  {contest.type !== "online" && (
                    <>
                      {contest.city}, <Region regionCode={contest.regionCode} regions={regions} swapPositions />
                    </>
                  )}
                </td>
                <td>
                  <ContestTypeBadge type={contest.type} />
                </td>
                <td>{contest.participants || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ContestsTable;
