import Link from "next/link";
import { Suspense } from "react";
import { SWRConfig, unstable_serialize as serialize } from "swr";
import { type ModDashboardFiltersDto, ModDashboardFiltersValidator } from "~/app/[slug]/mod/ModDashboardFilters.ts";
import DonateButton from "~/app/components/DonateButton.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { C, IS_CUBING_CONTESTS_INSTANCE, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { getHasRole, slugPath } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { getModContestsSF } from "~/server/server-functions/contest-server-functions.ts";
import {
  authorizeUser,
  getRegions,
  validateMaxMonthlyContests,
} from "~/server/server-only-functions/server-only-functions.ts";
import ModDashboardScreen from "./ModDashboardScreen.tsx";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<ModDashboardFiltersDto>;
};

async function ModeratorDashboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = ModDashboardFiltersValidator.parse(await searchParams);
  const { member, organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { modDashboard: ["view"] },
  });

  const [
    { success: isAdminView },
    { success: canUpdateMembers },
    regions,
    maxMonthlyContestsReached,
    isEventsListEmpty,
  ] = await Promise.all([
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { adminDashboard: ["view"] } } }),
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { member: ["update"] } } }),
    getRegions(organization!.id),
    validateMaxMonthlyContests(organization!)
      .then(() => false)
      .catch(() => true),
    db.query.events
      .findFirst({ columns: { id: true }, where: { organizationId: organization!.id } })
      .then((res) => !res),
  ]);

  return (
    <section>
      <h2 className="mx-2 mb-4 text-center">Moderator Dashboard</h2>

      <div className="px-2">
        <ToastMessages />

        {IS_CUBING_CONTESTS_INSTANCE && (
          <div className="alert alert-light mb-4" role="alert">
            We have a Cubing Contests Discord server!{" "}
            <a href={C.discordServerLink} target="_blank" rel="noreferrer">
              Click here to join
            </a>
            , then send your CC username and your Discord username in an email to {organization!.metadata.contactEmail}{" "}
            so you can be given the moderator role on the server.
          </div>
        )}

        {canUpdateMembers && !member!.personId && (
          <p className="fw-bold text-danger">
            You don't have a person linked to your member profile. Before you can enter any data, create a competitor
            profile on the <Link href={slugPath(slug, "/mod/competitors")}>Manage Competitors</Link> page and then link
            it to your member profile on the <Link href={slugPath(slug, "/mod/members")}>Manage Members</Link> page.
          </p>
        )}
        {maxMonthlyContestsReached && <p className="fw-bold text-danger">{C.message.maxMonthlyContestsReached}</p>}
        {isEventsListEmpty && isAdminView && (
          <p className="fw-bold text-danger">
            This space doesn't have any events. Set up the list of events using the{" "}
            <Link href={slugPath(slug, "/mod/events")}>configure events page</Link>.
          </p>
        )}

        <div className="d-flex fs-5 column-gap-2 column-gap-xl-3 row-gap-2 my-3 flex-wrap">
          {!maxMonthlyContestsReached && !isEventsListEmpty && (
            <Link
              href={slugPath(slug, "/mod/competition")}
              prefetch={false}
              className="btn btn-success btn-sm btn-lg-md"
            >
              Create new contest
            </Link>
          )}
          <Link href={slugPath(slug, "/mod/competitors")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
            Manage competitors
          </Link>
          {isAdminView && (
            <Link href={slugPath(slug, "/mod/api-keys")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
              API keys
            </Link>
          )}
          {isAdminView ? (
            <>
              <Link href={slugPath(slug, "/mod/members")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
                Manage members
              </Link>
              <Link
                href={slugPath(slug, "/mod/events")}
                prefetch={false}
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure events
              </Link>
              <Link
                href={slugPath(slug, "/mod/records-configuration")}
                prefetch={false}
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure records
              </Link>
              {IS_RR_INSTANCE && getHasRole("owner", member!.role) && (
                <Link href={slugPath(slug, "/billing")} prefetch={false} className="btn btn-secondary btn-sm btn-lg-md">
                  Billing
                </Link>
              )}
            </>
          ) : (
            IS_CUBING_CONTESTS_INSTANCE && (
              <a
                href="https://docs.google.com/forms/d/12AuZdtH4qHwTxd4Kxd2Y_TwZHlBuBu8XuKX3VdKrE60"
                target="_blank"
                rel="noreferrer"
                className="btn btn-light btn-sm btn-lg-md"
              >
                Request new event
              </a>
            )
          )}
          {organization!.metadata.showDonationLinks && <DonateButton />}
        </div>
      </div>

      <SWRConfig
        value={{
          fallback: {
            [serialize(["mod", filters])]: getModContestsSF(filters),
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <ModDashboardScreen regions={regions} isAdminView={isAdminView} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default ModeratorDashboardPage;
