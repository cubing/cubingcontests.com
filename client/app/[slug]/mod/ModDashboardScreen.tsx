"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useModDashboardQueryState } from "~/app/[slug]/mod/ModDashboardFilters.ts";
import ModFilters from "~/app/[slug]/mod/ModFilters.tsx";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Region from "~/app/components/Region.tsx";
import { getFormattedDate, slugPath } from "~/helpers/utility-functions.ts";
import { getModContestsSF } from "~/server/server-functions/contest-server-functions.ts";
import ContestControls from "./ContestControls.tsx";

type Props = {
  isAdminView: boolean;
};

function ModDashboardScreen({ isAdminView }: Props) {
  const { slug }: { slug: string } = useParams();
  const [filters] = useModDashboardQueryState();
  const { data, isLoading, isValidating, mutate } = useSWR(["mod", filters], () => getModContestsSF(filters));

  const contests = data?.data?.contests;
  const isPending = isLoading || isValidating;

  return (
    <>
      <div className="px-2">
        <ModFilters initOrganizerPerson={data?.data?.organizerPerson} isAdminView={isAdminView} disabled={isPending} />
        {!isAdminView && !filters.state && contests?.every((c) => c.state === "created") && (
          <p className="fw-bold my-3 text-danger">
            Your contests will not be publicly visible and you will not be able to enter results until an admin approves
            them
          </p>
        )}
        <p>
          Number of contests: <strong>{contests?.length ?? "…"}</strong>
        </p>
      </div>

      {!contests || contests.length === 0 ? (
        <p className="fs-5 px-2">No contests found</p>
      ) : (
        <div className="table-responsive mb-5">
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
                <th scope="col">Actions</th>
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
                      <div className="d-flex align-items-center">
                        <span className="d-inline-block m-0 text-truncate" style={{ maxWidth: "18rem" }}>
                          {contest.city}
                        </span>
                        <span className="me-1">,</span>
                        <Region regionCode={contest.regionCode} swapPositions shorten />
                      </div>
                    )}
                  </td>
                  <td>
                    <ContestTypeBadge type={contest.type} display="short" />
                  </td>
                  <td>{contest.participants || ""}</td>
                  <td>
                    {contest.state === "removed" ? (
                      <span className="text-danger">Removed</span>
                    ) : (
                      <ContestControls contest={contest} forPage="mod-dashboard" onUpdateContestState={mutate} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ModDashboardScreen;
