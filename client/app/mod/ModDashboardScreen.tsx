"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { ContestState } from "~/helpers/enums.ts";
import { getFormattedDate } from "~/helpers/utilityFunctions.ts";
import { MainContext } from "~/helpers/contexts.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Country from "~/app/components/Country.tsx";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Button from "~/app/components/UI/Button.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import { C } from "~/helpers/constants.ts";
import { useRouter, useSearchParams } from "next/navigation";
import ModFilters from "~/app/mod/ModFilters";
import { authClient } from "~/helpers/authClient.ts";

type Props = {
  contests: any[]; //IContest[]
};

function ModDashboardScreen({ contests: initContests }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();

  const [contests, setContests] = useState<any[]>(initContests);
  // const [adminStats, setAdminStats] = useState<IAdminStats>();
  // const [showAnalytics, setShowAnalytics] = useState(false);

  const isAdmin = session?.user.role === "admin";

  // const pendingContests = contests?.filter((c: IContest) =>
  //   c.state === ContestState.Created ||
  //   (c.state > ContestState.Approved && c.state < ContestState.Published)
  // ).length ?? 0;

  // const fetchContests = async (newOrganizerId?: string | number) => {
  //   const res = await myFetch.get(
  //     `/competitions/mod${newOrganizerId ? `?organizerId=${newOrganizerId}` : ""}`,
  //     { authorize: true },
  //   );

  //   if (res.success) setContests(res.data);
  // };

  // useEffect(() => {
  //   const organizerId = searchParams.get("organizerId");
  //   fetchContests(typeof organizerId === "string" ? organizerId : undefined);

  //   if (isAdmin) {
  //     myFetch.get("/admin-stats", { authorize: true }).then((res) => {
  //       if (res.success) setAdminStats(res.data);
  //     });
  //   }
  // }, []);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  // const changeState = async (competitionId: string, newState: ContestState) => {
  //   const verb = newState === ContestState.Approved
  //     ? "approve"
  //     : newState === ContestState.Finished
  //     ? "finish"
  //     : newState === ContestState.Published
  //     ? "publish"
  //     : "ERROR";
  //   const contest = contests?.find((c: IContest) => c.competitionId === competitionId) as IContest;

  //   if (confirm(`Are you sure you would like to ${verb} ${contest.name}?`)) {
  //     const res = await myFetch.patch(
  //       `/competitions/set-state/${competitionId}`,
  //       { newState },
  //       { loadingId: `set_state_${newState}_${competitionId}_button` },
  //     );

  //     if (res.success) {
  //       setContests(
  //         (contests as IContest[]).map((
  //           c,
  //         ) => (c.competitionId === competitionId ? res.data : c)),
  //       );
  //     }
  //   }
  // };

  // const selectPerson = (person: IPerson) => {
  //   router.replace(`/mod?organizerId=${person.personId}`);
  //   fetchContests(person.personId);
  // };

  // const resetFilters = () => {
  //   router.replace("/mod");
  //   fetchContests();
  // };

  return (
    <div>
      <div className="px-2">
        <h2 className="mb-4 text-center">Moderator Dashboard</h2>

        <ToastMessages />

        <div className="alert alert-light mb-4" role="alert">
          We now have a Cubing Contests Discord server!{" "}
          <a href="https://discord.gg/7rRMQA8jnU" target="_blank">
            Click here to join
          </a>. Then send your Discord username in an email to {C.contactEmail}{" "}
          so you can be given the moderator role on the server.
        </div>

        <div className="my-4 d-flex flex-wrap gap-3 fs-5">
          <Link
            href="/mod/competition"
            className="btn btn-success btn-sm btn-lg-md"
          >
            Create new contest
          </Link>
          <Link
            href="/mod/competitors"
            className="btn btn-warning btn-sm btn-lg-md"
          >
            Manage competitors
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin/results"
                className="btn btn-warning btn-sm btn-lg-md"
              >
                Manage results
              </Link>
              <Link
                href="/admin/users"
                className="btn btn-warning btn-sm btn-lg-md"
              >
                Manage users
              </Link>
              <Link
                href="/admin/events"
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure events
              </Link>
              <Link
                href="/admin/record-types"
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure record types
              </Link>
            </>
          )}
        </div>
        {
          /* {adminStats && (
          <>
            <p>
              Total contests:&nbsp;<b>
                {contests?.length ?? 0}
              </b>&#8194;|&#8194;Pending:&nbsp;<b>{pendingContests}</b>
            </p>
            <p>
              Total competitors: <b>{adminStats.totalPersons}</b>&#8194;|&#8194;Not approved:&nbsp;
              <b>{adminStats.unapprovedPersons}</b>
            </p>
            <p>
              Total users:&nbsp;
              <b>{adminStats.totalUsers}</b>&#8194;|&#8194;Not approved:&nbsp;<b>{adminStats.unapprovedUsers}</b>
            </p>
            <p>
              Total results:&nbsp;<b>
                {adminStats.totalResults}
              </b>&#8194;|&#8194;Not approved:&nbsp;
              <b>{adminStats.totalUnapprovedSubmittedResults}</b>
            </p>
            <Button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="btn btn-success btn-sm mb-3"
            >
              {showAnalytics ? "Hide analytics" : "Show analytics"}
            </Button>
            {showAnalytics && (
              <div className="mb-4">
                <h5 className="mb-4">Stats for the past month</h5>

                {adminStats?.analytics.map((stat: any) => (
                  <p key={stat.label} className="mb-2">
                    {stat.label}: <b>{stat.value}</b>
                  </p>
                ))}
              </div>
            )}
          </>
        )} */
        }
        {!isAdmin && contests && (
          <>
            {!contests.some((c) => c.state >= ContestState.Approved) && (
              <p className="my-3 text-danger fw-bold">
                Your contests will not be public and you will not be able to enter results until an admin approves them
              </p>
            )}
            <p>
              Number of contests: <b>{contests.length}</b>
            </p>
          </>
        )}
      </div>

      {
        /* <ModFilters
        onSelectPerson={selectPerson}
        onResetFilters={resetFilters}
        disabled={!contests}
      /> */
      }

      {!contests
        ? <Loading />
        : contests.length === 0
        ? <p className="px-2 fs-5">You haven't created any contests yet</p>
        : (
          <div className="mb-5 table-responsive">
            <table className="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Name</th>
                  <th scope="col">Place</th>
                  <th scope="col">Type</th>
                  <th scope="col">
                    <FontAwesomeIcon
                      icon={faUserGroup}
                      aria-label="Number of participants"
                    />
                  </th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((contest) => {
                  const showApproveButton = contest.state === ContestState.Created && isAdmin &&
                    (contest.meetupDetails || contest.compDetails);

                  return (
                    <tr key={contest.competitionId}>
                      <td>
                        {getFormattedDate(contest.startDate, contest.endDate)}
                      </td>
                      <td>
                        <Link
                          href={`/competitions/${contest.competitionId}`}
                          prefetch={false}
                          className="link-primary"
                        >
                          {contest.shortName}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span
                            className="d-inline-block m-0 text-truncate"
                            style={{ maxWidth: "18rem" }}
                          >
                            {contest.city}
                          </span>
                          <span className="me-1">,</span>
                          <Country
                            countryIso2={contest.countryIso2}
                            swapPositions
                            shorten
                          />
                        </div>
                      </td>
                      <td>
                        <ContestTypeBadge type={contest.type} brief />
                      </td>
                      <td>{contest.participants || ""}</td>
                      <td>
                        {contest.state === ContestState.Removed
                          ? <span className="text-danger">Removed</span>
                          : (
                            <div className="d-flex gap-2">
                              {(contest.state < ContestState.Finished || isAdmin) && (
                                <Link
                                  href={`/mod/competition?edit_id=${contest.competitionId}`}
                                  prefetch={false}
                                  className="btn btn-primary btn-xs"
                                  aria-label="Edit"
                                >
                                  <FontAwesomeIcon icon={faPencil} />
                                </Link>
                              )}
                              {(contest.state >= ContestState.Approved &&
                                contest.state < ContestState.Published &&
                                (contest.state < ContestState.Finished || isAdmin)) && (
                                <Link
                                  href={`/mod/competition/${contest.competitionId}`}
                                  prefetch={false}
                                  className="btn btn-xs btn-success"
                                >
                                  Results
                                </Link>
                              )}
                              {
                                /* {showApproveButton && (
                                <Button
                                  id={`set_state_${ContestState.Approved}_${contest.competitionId}_button`}
                                  type="button"
                                  onClick={() => changeState( contest.competitionId, ContestState.Approved)}
                                  loadingId={loadingId}
                                  className="btn btn-warning btn-xs"
                                >
                                  Approve
                                </Button>
                              )}
                              {contest.state === ContestState.Ongoing && (
                                <Button
                                  id={`set_state_${ContestState.Finished}_${contest.competitionId}_button`}
                                  type="button"
                                  onClick={() => changeState( contest.competitionId, ContestState.Finished)}
                                  loadingId={loadingId}
                                  className="btn btn-warning btn-xs"
                                >
                                  Finish
                                </Button>
                              )}
                              {contest.state === ContestState.Finished &&
                                (isAdmin
                                  ? (
                                    <Button
                                      id={`set_state_${ContestState.Published}_${contest.competitionId}_button`}
                                      type="button"
                                      onClick={() => changeState( contest.competitionId, ContestState.Published)}
                                      loadingId={loadingId}
                                      className="btn btn-warning btn-xs"
                                    >
                                      Publish
                                    </Button>
                                  )
                                  : (
                                    <FontAwesomeIcon icon={faClock} className="my-1 fs-5" />
                                  ))} */
                              }
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

export default ModDashboardScreen;
